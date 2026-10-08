import { chromium } from 'playwright';

const COMPANY_LOGO = 'https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png';
const DIGITAL_SIGNATURE_URL = 'https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1776081157/WhatsApp_Image_2026-04-09_at_4.00.56_PM-removebg-preview_1_2_ob4alx.png';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit?: string;
  sacCode?: string;
  unitPrice: number;
  taxRate: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  type?: 'invoice' | 'quotation';
  validUntil?: string;
  status?: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  clientGSTIN?: string;
  GSTIN?: string;
  state?: string;
  placeOfSupply?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  taxableAmount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  tax: number;
  total: number;
  paidAmount?: number;
  amountInWords?: string;
  notes?: string;
  terms?: string;
  companyName?: string;
  companyEmail?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyGST?: string;
  companyCIN?: string;
  companyWebsite?: string;
  companyAccountName?: string;
  companyBankName?: string;
  companyAccountNumber?: string;
  companyIFSC?: string;
  companyBranch?: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

export function buildHTML(data: InvoiceData) {
  const isQuotation = data.type === 'quotation';
  const docLabel = isQuotation ? 'QUOTATION' : 'TAX INVOICE';

  const itemRows = (data.items || [])
    .map((item, i) => {
      const amount = (item.quantity || 0) * (item.unitPrice || 0);
      const taxAmt = amount * ((item.taxRate || 0) / 100);
      const total = amount + taxAmt;

      return `
        <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td class="td-center">${i + 1}</td>
          <td><strong>${item.description || ''}</strong></td>
          <td class="td-center">${item.sacCode || '—'}</td>
          <td class="td-center">${item.quantity || 0} ${item.unit || ''}</td>
          <td class="td-right">${formatCurrency(item.unitPrice || 0)}</td>
          <td class="td-right">${formatCurrency(amount)}</td>
          <td class="td-center">${item.taxRate || 0}%</td>
          <td class="td-right">${formatCurrency(taxAmt)}</td>
          <td class="td-right"><strong>${formatCurrency(total)}</strong></td>
        </tr>`;
    })
    .join('');

  // Tax calculations
  const totalTax = data.tax || 0;
  const isIgst = Boolean((data.igstAmount && data.igstAmount > 0) || (data.igst && data.igst > 0));
  
  let cgstVal = data.cgstAmount;
  let sgstVal = data.sgstAmount;
  
  if (!isIgst && totalTax > 0 && !cgstVal && !sgstVal) {
    cgstVal = totalTax / 2;
    sgstVal = totalTax / 2;
  }

  const taxableVal = data.taxableAmount || data.subtotal || 0;
  const totalRate = taxableVal > 0 ? (totalTax / taxableVal) * 100 : 0;
  const cgstRateVal = data.cgst !== undefined ? data.cgst : (totalRate / 2);
  const sgstRateVal = data.sgst !== undefined ? data.sgst : (totalRate / 2);

  const taxSummary = !isQuotation ? `
    <div class="section" style="margin-top: 20px;">
      <div class="tax-box">
        <div class="tax-header">📋 TAX SUMMARY</div>
        <table class="tax-table">
          <thead>
            <tr>
              <th style="width: 25%">TAXABLE AMOUNT</th>
              ${isIgst ? `
                <th style="width: 25%">IGST (${(data.igst || totalRate).toFixed(1)}%)</th>
                <th style="width: 25%">IGST AMOUNT</th>
              ` : `
                <th style="width: 25%">CGST (${cgstRateVal.toFixed(1)}%)</th>
                <th style="width: 25%">SGST (${sgstRateVal.toFixed(1)}%)</th>
              `}
              <th style="width: 25%; text-align: right;">TOTAL TAX</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 600;">${formatCurrency(taxableVal)}</td>
              ${isIgst ? `
                <td>${(data.igst || totalRate).toFixed(1)}%</td>
                <td>${formatCurrency(data.igstAmount || totalTax)}</td>
              ` : `
                <td>${formatCurrency(cgstVal || 0)}</td>
                <td>${formatCurrency(sgstVal || 0)}</td>
              `}
              <td style="text-align: right; font-weight: 700; color: #166534;">${formatCurrency(totalTax)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>` : '';

  const bankSection = !isQuotation && data.companyAccountNumber ? `
    <div class="bank-box">
      <div class="bank-title">🏦 Payment Details</div>
      <table class="bank-table">
        <tr><td class="bank-label">Account Name</td><td>${data.companyAccountName || '—'}</td></tr>
        <tr><td class="bank-label">Bank Name</td><td>${data.companyBankName || '—'}</td></tr>
        <tr><td class="bank-label">Account No.</td><td><strong>${data.companyAccountNumber}</strong></td></tr>
        <tr><td class="bank-label">IFSC Code</td><td>${data.companyIFSC || '—'}</td></tr>
        ${data.companyBranch ? `<tr><td class="bank-label">Branch</td><td>${data.companyBranch}</td></tr>` : ''}
      </table>
    </div>` : '';

  let badgeHtml = '';
  if (!isQuotation) {
    const paid = data.paidAmount || 0;
    if (paid >= data.total && data.total > 0) {
      badgeHtml = `<div style="margin-top:8px; display:inline-block; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:bold; background:#dcfce7; color:#166534; border:1px solid #86efac;">🟢 PAID</div>`;
    } else if (paid > 0) {
      badgeHtml = `<div style="margin-top:8px; display:inline-block; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:bold; background:#ffedd5; color:#c2410c; border:1px solid #fdba74;">🟠 PARTIALLY PAID</div>`;
    } else {
      badgeHtml = `<div style="margin-top:8px; display:inline-block; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:bold; background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;">🔴 UNPAID</div>`;
    }
  } else if (data.status) {
    const statusUpper = data.status.toUpperCase();
    const isAccepted = statusUpper === 'ACCEPTED';
    const isDeclined = statusUpper === 'DECLINED';
    const bg = isAccepted ? '#dcfce7' : isDeclined ? '#fee2e2' : '#dbeafe';
    const color = isAccepted ? '#166534' : isDeclined ? '#b91c1c' : '#1e40af';
    const border = isAccepted ? '#86efac' : isDeclined ? '#fca5a5' : '#93c5fd';
    badgeHtml = `<div style="margin-top:8px; display:inline-block; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:bold; background:${bg}; color:${color}; border:1px solid ${border};">${statusUpper}</div>`;
  }

  const clientGst = data.clientGSTIN || data.GSTIN;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${docLabel} - ${data.invoiceNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1a1a1a;
      background: #f8fafc;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      position: relative;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    /* Header */
    .header-band {
      background: linear-gradient(135deg, #0d4f2e 0%, #166534 100%);
      padding: 22px 35px 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo-area { display: flex; align-items: center; gap: 12px; }
    .logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
      background: #fff;
      border-radius: 6px;
      padding: 4px;
    }
    .company-name {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .company-tagline {
      color: #bbf7d0;
      font-size: 9.5px;
    }
    .doc-label {
      color: #fff;
      font-size: 23px;
      font-weight: 800;
      letter-spacing: 2px;
      text-align: right;
    }
    .doc-number {
      color: #bbf7d0;
      font-size: 12px;
      margin-top: 4px;
      font-weight: 600;
      text-align: right;
    }

    .accent-stripe {
      height: 4px;
      background: linear-gradient(90deg, #22c55e, #4ade80, #86efac);
    }

    /* Meta Bar */
    .meta-bar {
      background: #f0fdf4;
      border-bottom: 1px solid #bbf7d0;
      padding: 12px 35px;
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      font-size: 11px;
    }
    .meta-item { flex: 1; min-width: 140px; }
    .meta-label {
      color: #166534;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .meta-value { font-weight: 600; margin-top: 2px; }

    .body-content {
      padding: 24px 35px 70px;
    }

    /* Parties */
    .parties-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 22px;
    }
    .party-card {
      border: 1px solid #d1fae5;
      border-radius: 6px;
      overflow: hidden;
    }
    .party-card-header {
      background: linear-gradient(135deg, #166534, #15803d);
      color: #fff;
      padding: 7px 12px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .party-card-body {
      padding: 10px 12px;
      background: #f9fefb;
      font-size: 10.5px;
      line-height: 1.5;
    }
    .party-name { font-weight: 700; color: #0d4f2e; margin-bottom: 4px; font-size: 12px; }

    .section-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #22c55e;
      padding-bottom: 4px;
      margin-bottom: 12px;
    }

    .section {
      margin-bottom: 24px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d1fae5;
      font-size: 10.5px;
    }
    .items-table thead {
      background: linear-gradient(135deg, #0d4f2e, #166534);
      color: #fff;
    }
    .items-table th, .items-table td {
      padding: 7px 6px;
      border-bottom: 1px solid #d1fae5;
      text-align: left;
    }
    .items-table th { font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
    .td-center { text-align: center; }
    .td-right { text-align: right; }
    .row-even { background: #fff; }
    .row-odd { background: #f0fdf4; }

    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 18px;
    }

    .bank-box, .totals-box {
      border: 1px solid #d1fae5;
      border-radius: 6px;
      overflow: hidden;
    }
    .bank-title, .totals-header, .tax-header {
      background: linear-gradient(135deg, #166534, #15803d);
      color: #fff;
      padding: 7px 12px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .bank-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      background: #f9fefb;
    }
    .bank-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #f0fdf4;
    }
    .bank-label {
      width: 110px;
      color: #166534;
      font-weight: 600;
    }

    .tax-box {
      border: 1px solid #d1fae5;
      border-radius: 6px;
      overflow: hidden;
    }
    .tax-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .tax-table th {
      background: #f0fdf4;
      color: #166534;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8.5px;
      padding: 6px 8px;
      border-bottom: 1px solid #d1fae5;
      text-align: left;
    }
    .tax-table td {
      padding: 8px 8px;
      background: #fff;
      text-align: left;
      border-bottom: 0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 11px;
      border-bottom: 1px solid #f0fdf4;
      background: #fff;
    }
    .grand-total {
      background: linear-gradient(135deg, #0d4f2e, #166534);
      color: #fff;
      font-weight: 700;
      font-size: 13px;
    }

    .signature-row {
      margin-top: 36px;
      display: flex;
      justify-content: flex-end;
      padding-right: 15px;
    }
    .signature-box {
      text-align: center;
      width: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .sig-image {
      max-height: 60px;
      max-width: 180px;
      width: auto;
      margin-bottom: -5px;
      object-fit: contain;
      z-index: 10;
    }
    .sig-line {
      width: 100%;
      border-top: 1.5px solid #166534;
      margin: 0 0 5px;
    }
    .sig-label {
      font-size: 10px;
      color: #166534;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .declaration {
      margin-top: 16px;
      font-size: 9.5px;
      color: #6b7280;
      text-align: center;
      font-style: italic;
    }

    .footer-band {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #0d4f2e, #166534);
      padding: 12px 35px;
      color: #bbf7d0;
      font-size: 9px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 0mm;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }
      .page {
        width: 100% !important;
        min-height: 100% !important;
        margin: 0 !important;
        box-shadow: none !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header-band">
    <div class="logo-area">
      <img class="logo-img" src="${COMPANY_LOGO}" alt="Ephorsys" crossorigin="anonymous"/>
      <div>
        <div class="company-name">${data.companyName || 'EPHORSYS PVT. LTD'}</div>
        <div class="company-tagline">Software Solutions & Technology Services</div>
      </div>
    </div>
    <div style="text-align: right;">
      <div class="doc-label">${docLabel}</div>
      <div class="doc-number">${data.invoiceNumber}</div>
      ${badgeHtml}
    </div>
  </div>

  <div class="accent-stripe"></div>

  <!-- Meta Bar -->
  <div class="meta-bar">
    <div class="meta-item">
      <div class="meta-label">${isQuotation ? 'Quotation Date' : 'Invoice Date'}</div>
      <div class="meta-value">${formatDate(data.date)}</div>
    </div>
    ${isQuotation && (data.validUntil || data.dueDate) ? `
    <div class="meta-item">
      <div class="meta-label">Valid Until</div>
      <div class="meta-value">${formatDate(data.validUntil || data.dueDate)}</div>
    </div>` : ''}
    ${!isQuotation && data.dueDate ? `
    <div class="meta-item">
      <div class="meta-label">Due Date</div>
      <div class="meta-value" style="color:#dc2626;">${formatDate(data.dueDate)}</div>
    </div>` : ''}
    ${data.companyGST ? `
    <div class="meta-item">
      <div class="meta-label">Company GSTIN</div>
      <div class="meta-value">${data.companyGST}</div>
    </div>` : ''}
  </div>

  <div class="body-content">

    <!-- Parties -->
    <div class="parties-row">
      <div class="party-card">
        <div class="party-card-header">From (Seller)</div>
        <div class="party-card-body">
          <div class="party-name">${data.companyName || 'Ephorsys Pvt. Ltd'}</div>
          <div>${data.companyAddress || 'FIRST FLOOR, K-8/733, Kalinganagar, Bhubaneswar, Odisha, 751003'}</div>
          ${data.companyPhone ? `<div>📞 ${data.companyPhone}</div>` : ''}
          ${data.companyEmail ? `<div>✉ ${data.companyEmail}</div>` : ''}
        </div>
      </div>
      <div class="party-card">
        <div class="party-card-header">${isQuotation ? 'Quotation For' : 'Bill To'}</div>
        <div class="party-card-body">
          <div class="party-name">${data.clientName || 'Valued Client'}</div>
          ${data.clientEmail ? `<div>✉ ${data.clientEmail}</div>` : ''}
          ${data.clientAddress ? `<div>${data.clientAddress}</div>` : ''}
          ${clientGst ? `<div style="margin-top:6px; font-weight:600; font-size:9.5px; color:#166534;">GSTIN: ${clientGst}</div>` : ''}
          ${data.state ? `<div style="font-size:9.5px;">State: ${data.state}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="section">
      <div class="section-title">Items / Services</div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:28px;" class="td-center">#</th>
            <th>Description</th>
            <th style="width:80px;" class="td-center">SAC Code</th>
            <th style="width:55px;" class="td-center">Qty</th>
            <th style="width:75px;" class="td-right">Rate</th>
            <th style="width:75px;" class="td-right">Amount</th>
            <th style="width:45px;" class="td-center">Tax%</th>
            <th style="width:70px;" class="td-right">Tax</th>
            <th style="width:80px;" class="td-right">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    ${taxSummary}

    <!-- Bottom Section -->
    <div class="bottom-row">
      <div>
        ${bankSection}
        ${data.notes ? `
          <div style="margin-top: 12px; padding: 10px; background: #f9fefb; border: 1px solid #d1fae5; border-radius: 6px;">
            <div style="font-weight: 700; color: #166534; font-size: 9.5px; margin-bottom: 4px;">NOTES / TERMS</div>
            <div style="font-size: 9.5px; color: #4b5563; white-space: pre-line;">${data.notes}</div>
          </div>
        ` : ''}
      </div>

      <!-- Totals -->
      <div class="totals-box">
        <div class="totals-header">Amount Summary</div>
        <div class="total-row"><span>Subtotal</span><span>${formatCurrency(data.subtotal)}</span></div>
        ${data.discountAmount ? `<div class="total-row" style="color:#dc2626;"><span>Discount</span><span>− ${formatCurrency(data.discountAmount)}</span></div>` : ''}
        <div class="total-row"><span>Tax</span><span>${formatCurrency(data.tax)}</span></div>
        <div class="total-row grand-total">
          <span>GRAND TOTAL</span>
          <span>${formatCurrency(data.total)}</span>
        </div>
        ${(!isQuotation && data.paidAmount !== undefined) ? `
        <div class="total-row" style="color:#16a34a; font-weight:600;">
          <span>Paid Amount</span>
          <span>${formatCurrency(data.paidAmount)}</span>
        </div>
        <div class="total-row" style="color:#dc2626; font-weight:700;">
          <span>Balance Due</span>
          <span>${formatCurrency(data.total - data.paidAmount)}</span>
        </div>
        ` : ''}
        ${data.amountInWords ? `<div style="padding:6px 12px; font-size:9.5px; font-style:italic; color:#166534; background:#f0fdf4;">${data.amountInWords}</div>` : ''}
      </div>
    </div>

    <!-- Digital Signature -->
    <div class="signature-row">
      <div class="signature-box">
        <img src="${DIGITAL_SIGNATURE_URL}" class="sig-image" alt="Digital Signature" crossorigin="anonymous"/>
        <div class="sig-line"></div>
        <div class="sig-label">Authorised Signatory</div>
        <div style="font-size:9.5px; color:#374151; margin-top:2px;">${data.companyName || 'Ephorsys Pvt. Ltd'}</div>
      </div>
    </div>

    <div class="declaration">
      This document is electronically generated and verified by Ephorsys Private Limited.
    </div>

  </div>

  <!-- Footer -->
  <div class="footer-band">
    <div>${data.companyName || 'Ephorsys Pvt. Ltd'} • ${data.companyWebsite || 'www.ephorsys.com'}</div>
    <div>Computer Generated Document</div>
  </div>

</div>
</body>
</html>`;
}

/**
 * Generate PDF using Playwright (optimized for single/multi A4 page)
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    const htmlContent = buildHTML(data);

    await page.setContent(htmlContent, { 
      waitUntil: 'load',
      timeout: 30000 
    });

    // Wait for images (logo + signature) to load
    await page.evaluate(() => 
      Promise.all(
        Array.from(document.images).map(img => 
          img.complete ? Promise.resolve() : new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          })
        )
      )
    ).catch(() => {});

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);

  } catch (error) {
    console.error('Playwright PDF generation error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

export async function generateQuotationPDF(data: InvoiceData): Promise<Buffer> {
  return generateInvoicePDF({ ...data, type: 'quotation' });
}