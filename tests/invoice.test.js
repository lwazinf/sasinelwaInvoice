const test = require('node:test');
const assert = require('node:assert/strict');

const { parseInstructions, parseTaxRate } = require('../src/emailInstructionParser');
const { normalizeInvoiceData } = require('../src/invoiceTemplate');
const { parseRequestBody } = require('../src/server');

test('parseInstructions extracts keys and items', () => {
  const raw = [
    'company: Sasinelwa Studio',
    'client_name: Acme Ops',
    'item: Design cleanup | 1 | 1200',
    'item: Automation setup | 2 | 350',
    'tax_rate: 0.15'
  ].join('\n');

  const result = parseInstructions(raw);
  assert.equal(result.companyName, 'Sasinelwa Studio');
  assert.equal(result.clientName, 'Acme Ops');
  assert.equal(result.items.length, 2);
  assert.equal(result.taxRate, 0.15);
});

test('parseTaxRate accepts percentage inputs', () => {
  assert.equal(parseTaxRate('15%'), 0.15);
  assert.equal(parseTaxRate('15'), 0.15);
  assert.equal(parseTaxRate('0.2'), 0.2);
});

test('normalizeInvoiceData computes totals', () => {
  const model = normalizeInvoiceData({
    items: [
      { description: 'A', quantity: 1, unitPrice: 100 },
      { description: 'B', quantity: 2, unitPrice: 50 }
    ],
    taxRate: 0.1
  });

  assert.equal(model.subtotal, '$200.00');
  assert.equal(model.tax, '$20.00');
  assert.equal(model.total, '$220.00');
});

test('parseRequestBody handles form payload', () => {
  const result = parseRequestBody('from=test%40a.com&subject=Hello', 'application/x-www-form-urlencoded');
  assert.equal(result.from, 'test@a.com');
  assert.equal(result.subject, 'Hello');
});

test('parseRequestBody throws 400 on malformed json', () => {
  assert.throws(() => parseRequestBody('{"bad"', 'application/json'), (error) => error.statusCode === 400);
});
