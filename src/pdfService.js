const puppeteer = require('puppeteer');
const { renderInvoiceHtml } = require('./invoiceTemplate');

async function generateInvoicePdfBuffer(invoiceData) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const html = renderInvoiceHtml(invoiceData);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16px', right: '16px', bottom: '16px', left: '16px' }
    });
    return { pdfBuffer, html };
  } finally {
    await browser.close();
  }
}

module.exports = {
  generateInvoicePdfBuffer
};
