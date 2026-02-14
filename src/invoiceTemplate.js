const mustache = require('mustache');

const template = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice {{invoiceNumber}}</title>
    <style>
      :root {
        --ink: #1f2937;
        --muted: #6b7280;
        --brand: #0f766e;
        --panel: #f8fafc;
        --line: #e5e7eb;
      }
      * { box-sizing: border-box; }
      body {
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: var(--ink);
        margin: 0;
        background: #fff;
      }
      .page {
        max-width: 900px;
        margin: 24px auto;
        border: 1px solid var(--line);
        border-radius: 16px;
        overflow: hidden;
      }
      .header {
        padding: 28px 32px;
        background: linear-gradient(120deg, #f0fdfa, #ecfeff);
        display: flex;
        justify-content: space-between;
      }
      .title { font-size: 28px; margin: 0; letter-spacing: 0.02em; }
      .subtitle { color: var(--muted); margin-top: 6px; }
      .meta {
        text-align: right;
        font-size: 14px;
        line-height: 1.5;
      }
      .content { padding: 28px 32px 36px; }
      .cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 24px;
      }
      .card {
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--panel);
        padding: 16px;
      }
      .label {
        font-size: 12px;
        font-weight: 600;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 8px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      th, td {
        border-bottom: 1px solid var(--line);
        padding: 12px 8px;
        text-align: left;
        font-size: 14px;
      }
      th { color: var(--muted); font-weight: 600; }
      .amount { text-align: right; font-variant-numeric: tabular-nums; }
      .totals {
        margin-left: auto;
        width: 340px;
        margin-top: 20px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px dashed var(--line);
      }
      .grand {
        font-weight: 700;
        color: var(--brand);
        border-bottom: none;
        font-size: 18px;
      }
      .notes {
        margin-top: 28px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
      }
      @media print {
        .page { border: none; margin: 0; border-radius: 0; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="header">
        <div>
          <h1 class="title">Invoice</h1>
          <div class="subtitle">{{companyName}}</div>
        </div>
        <div class="meta">
          <div><strong>#{{invoiceNumber}}</strong></div>
          <div>Issued: {{issueDate}}</div>
          <div>Due: {{dueDate}}</div>
        </div>
      </header>
      <main class="content">
        <section class="cards">
          <div class="card">
            <div class="label">Bill To</div>
            <div>{{clientName}}</div>
            <div>{{clientEmail}}</div>
          </div>
          <div class="card">
            <div class="label">From</div>
            <div>{{companyName}}</div>
            <div>{{companyEmail}}</div>
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Qty</th>
              <th class="amount">Unit</th>
              <th class="amount">Total</th>
            </tr>
          </thead>
          <tbody>
            {{#items}}
            <tr>
              <td>{{description}}</td>
              <td class="amount">{{quantity}}</td>
              <td class="amount">{{unitPrice}}</td>
              <td class="amount">{{lineTotal}}</td>
            </tr>
            {{/items}}
          </tbody>
        </table>

        <section class="totals">
          <div class="total-row"><span>Subtotal</span><span>{{subtotal}}</span></div>
          <div class="total-row"><span>Tax</span><span>{{tax}}</span></div>
          <div class="total-row grand"><span>Total</span><span>{{total}}</span></div>
        </section>

        <div class="notes">
          {{notes}}
        </div>
      </main>
    </div>
  </body>
</html>`;

function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value));
}

function normalizeInvoiceData(input = {}) {
  const sourceItems = (input.items || []).map((item) => ({
    description: item.description || 'Service',
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unitPrice || 0)
  }));

  const items = sourceItems.map((item) => ({
    description: item.description,
    quantity: item.quantity.toFixed(2),
    unitPrice: formatCurrency(item.unitPrice),
    lineTotal: formatCurrency(item.quantity * item.unitPrice)
  }));

  const subtotalRaw = sourceItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxRate = Number(input.taxRate || 0);
  const taxRaw = subtotalRaw * taxRate;
  const totalRaw = subtotalRaw + taxRaw;

  return {
    companyName: input.companyName || 'Sasinelwa Studio',
    companyEmail: input.companyEmail || 'billing@sasinelwa.com',
    invoiceNumber: input.invoiceNumber || `INV-${Date.now()}`,
    issueDate: input.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: input.dueDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
    clientName: input.clientName || 'Client Name',
    clientEmail: input.clientEmail || 'client@example.com',
    items,
    subtotal: formatCurrency(subtotalRaw),
    tax: formatCurrency(taxRaw),
    total: formatCurrency(totalRaw),
    notes: input.notes || 'Thank you for your business.'
  };
}

function renderInvoiceHtml(data) {
  return mustache.render(template, normalizeInvoiceData(data));
}

module.exports = {
  renderInvoiceHtml,
  normalizeInvoiceData
};
