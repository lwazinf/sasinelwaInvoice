const http = require('http');
const { URL } = require('url');
const { parseInstructions } = require('./emailInstructionParser');
const { generateInvoicePdfBuffer } = require('./pdfService');
const { renderInvoiceHtml } = require('./invoiceTemplate');

const port = Number(process.env.PORT || 3000);

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseRequestBody(rawBody, contentType = '') {
  if (!rawBody) {
    return {};
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(rawBody);
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawBody);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }

  return { text: rawBody };
}

async function sendViaMailgun({ to, subject, pdfBuffer, filename }) {
  const required = ['MAILGUN_DOMAIN', 'MAILGUN_API_KEY', 'REPLY_FROM'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing email env vars: ${missing.join(', ')}`);
  }

  const form = new FormData();
  form.append('from', process.env.REPLY_FROM);
  form.append('to', to);
  form.append('subject', subject);
  form.append('text', 'Your invoice document has been processed and is attached as PDF.');
  form.append('attachment', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);

  const endpoint = `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`;
  const auth = Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`
    },
    body: form
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mailgun send failed: ${response.status} ${text}`);
  }
}

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/preview') {
    const html = renderInvoiceHtml({
      invoiceNumber: 'P00005402',
      clientName: 'Acme Ops',
      clientEmail: 'ops@acme.com',
      items: [
        { description: 'Design cleanup', quantity: 1, unitPrice: 1200 },
        { description: 'Automation setup', quantity: 2, unitPrice: 350 }
      ],
      taxRate: 0.15,
      notes: 'Please pay within 14 days.'
    });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/generate') {
    try {
      const rawBody = await readBody(req);
      const body = parseRequestBody(rawBody, req.headers['content-type'] || '');
      const { pdfBuffer, html } = await generateInvoicePdfBuffer(body || {});

      if (url.searchParams.get('format') === 'html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="invoice.pdf"'
      });
      res.end(pdfBuffer);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/email/inbound') {
    try {
      const rawBody = await readBody(req);
      const body = parseRequestBody(rawBody, req.headers['content-type'] || '');
      const from = body.from || body.sender;
      const subject = body.subject || 'Invoice Request';
      const textBody = body.text || body['body-plain'] || '';

      if (!from || !textBody) {
        return sendJson(res, 400, { error: 'Expected sender and text body' });
      }

      const instructions = parseInstructions(textBody);
      const { pdfBuffer } = await generateInvoicePdfBuffer(instructions);

      await sendViaMailgun({
        to: from,
        subject: `Processed: ${subject}`,
        pdfBuffer,
        filename: `${instructions.invoiceNumber || 'invoice'}.pdf`
      });

      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

if (require.main === module) {
  http.createServer(handler).listen(port, () => {
    console.log(`Invoice processor listening on ${port}`);
  });
}

module.exports = {
  handler,
  parseRequestBody
};
