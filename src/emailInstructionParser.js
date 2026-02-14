function parseInstructions(raw = '') {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const data = {
    items: []
  };

  for (const line of lines) {
    if (line.toLowerCase().startsWith('item:')) {
      const payload = line.slice(5).trim();
      const [descriptionPart, quantityPart, unitPricePart] = payload.split('|').map((part) => part.trim());

      data.items.push({
        description: descriptionPart || 'Service',
        quantity: Number(quantityPart || 1),
        unitPrice: Number(unitPricePart || 0)
      });
      continue;
    }

    const [keyRaw, ...rest] = line.split(':');
    if (!keyRaw || rest.length === 0) {
      continue;
    }

    const key = keyRaw.trim().toLowerCase();
    const value = rest.join(':').trim();

    switch (key) {
      case 'company':
        data.companyName = value;
        break;
      case 'company_email':
        data.companyEmail = value;
        break;
      case 'invoice_number':
        data.invoiceNumber = value;
        break;
      case 'issue_date':
        data.issueDate = value;
        break;
      case 'due_date':
        data.dueDate = value;
        break;
      case 'client_name':
        data.clientName = value;
        break;
      case 'client_email':
        data.clientEmail = value;
        break;
      case 'tax_rate':
        data.taxRate = Number(value);
        break;
      case 'notes':
        data.notes = value;
        break;
      default:
        break;
    }
  }

  return data;
}

module.exports = {
  parseInstructions
};
