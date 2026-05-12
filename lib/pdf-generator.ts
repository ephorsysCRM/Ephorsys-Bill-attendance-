import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const COMPANY_LOGO = 'https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png';

// Add your digital signature image URL here (PNG with transparent background recommended)
const DIGITAL_SIGNATURE_URL = 'https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1776081157/WhatsApp_Image_2026-04-09_at_4.00.56_PM-removebg-preview_1_2_ob4alx.png';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit?: string;
  hsnCode?: string;
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
  clientEmail: string;
  clientAddress?: string;
  clientGSTIN?: string;
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
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildHTML(data: InvoiceData) {
  const isQuotation = data.type === 'quotation';
  const docLabel = isQuotation ? 'QUOTATION' : 'TAX INVOICE';

  const itemRows = data.items
    .map((item, i) => {
      const amount = item.quantity * item.unitPrice;
      const taxAmt = amount * (item.taxRate / 100);
      const total = amount + taxAmt;

      return `
        <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td class="td-center">${i + 1}</td>
          <td>${item.description}</td>
          ${!isQuotation ? `<td class="td-center">${item.hsnCode || '—'}</td>` : ''}
          <td class="td-center">${item.quantity} ${item.unit || ''}</td>
          <td class="td-right">${formatCurrency(item.unitPrice)}</td>
          <td class="td-right">${formatCurrency(amount)}</td>
          <td class="td-center">${item.taxRate}%</td>
          <td class="td-right">${formatCurrency(taxAmt)}</td>
          <td class="td-right"><strong>${formatCurrency(total)}</strong></td>
        </tr>`;
    })
    .join('');

  // Calculate tax components if they aren't explicitly provided
  const isIgst = (data.igstAmount && data.igstAmount > 0) || (data.igst && data.igst > 0);
  const totalTax = data.tax || 0;
  
  // Try to use provided amounts or split total tax
  let cgstVal = data.cgstAmount;
  let sgstVal = data.sgstAmount;
  
  if (!isIgst && totalTax > 0 && !cgstVal && !sgstVal) {
    cgstVal = totalTax / 2;
    sgstVal = totalTax / 2;
  }

  // Calculate rates for display
  const taxableVal = data.taxableAmount || data.subtotal || 0;
  const totalRate = taxableVal > 0 ? (totalTax / taxableVal) * 100 : 0;
  const cgstRateVal = data.cgst || (totalRate / 2);
  const sgstRateVal = data.sgst || (totalRate / 2);

  const taxSummary = !isQuotation ? `
    <div class="section" style="margin-top: 24px;">
      <div class="tax-box">
        <div class="tax-header">📋 TAX SUMMARY</div>
        <table class="tax-table">
          <thead>
            <tr>
              <th style="width: 25%">TAXABLE AMOUNT</th>
              ${isIgst ? `
                <th style="width: 25%">IGST (%)</th>
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1a1a1a;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      position: relative;
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
    }

    .accent-stripe {
      height: 4px;
      background: linear-gradient(90deg, #22c55e, #4ade80, #86efac);
    }

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
      padding: 24px 35px 20px;
    }

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
    }
    .party-card-body {
      padding: 10px 12px;
      background: #f9fefb;
      font-size: 10.5px;
    }
    .party-name { font-weight: 700; color: #0d4f2e; margin-bottom: 4px; }

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
      margin-bottom: 28px;
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
    .items-table th { font-weight: 700; text-transform: uppercase; font-size: 9.5px; }
    .td-center { text-align: center; }
    .td-right { text-align: right; }
    .row-even { background: #fff; }
    .row-odd { background: #f0fdf4; }

    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
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
    }

    .tax-box {
      border: 1px solid #d1fae5;
      border-radius: 6px;
      overflow: hidden;
      margin-top: 10px;
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
      text-align: left; /* Ensure left alignment */
    }
    .tax-table td {
      padding: 8px 8px;
      border-bottom: 0;
      background: #fff;
      text-align: left; /* Ensure left alignment */
    }
    .tax-table tr:last-child td { border-bottom: 0; }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 11px;
      border-bottom: 1px solid #f0fdf4;
    }
    .grand-total {
      background: linear-gradient(135deg, #0d4f2e, #166534);
      color: #fff;
      font-weight: 700;
      font-size: 13px;
    }

    .signature-row {
      margin-top: 40px;
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
      max-height: 65px;
      max-width: 180px;
      width: auto;
      margin-bottom: -5px;
      object-fit: contain;
      z-index: 10;
      transition: all 0.3s ease;
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
      margin-top: 18px;
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
    <div>
      <div class="doc-label">${docLabel}</div>
      <div class="doc-number">${data.invoiceNumber}</div>
      ${data.status ? `<div style="margin-top:6px; font-size:9px; color:#bbf7d0;">${data.status}</div>` : ''}
    </div>
  </div>

  <div class="accent-stripe"></div>

  <!-- Meta Bar -->
  <div class="meta-bar">
    <div class="meta-item">
      <div class="meta-label">${isQuotation ? 'Quotation Date' : 'Invoice Date'}</div>
      <div class="meta-value">${formatDate(data.date)}</div>
    </div>
    ${isQuotation && data.validUntil ? `
    <div class="meta-item">
      <div class="meta-label">Valid Until</div>
      <div class="meta-value">${formatDate(data.validUntil)}</div>
    </div>` : ''}
    ${!isQuotation && data.dueDate ? `
    <div class="meta-item">
      <div class="meta-label">Due Date</div>
      <div class="meta-value" style="color:#dc2626;">${formatDate(data.dueDate)}</div>
    </div>` : ''}
    ${data.companyGST ? `
    <div class="meta-item">
      <div class="meta-label">GSTIN</div>
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
          <div>${data.companyAddress || ''}</div>
          ${data.companyPhone ? `<div>📞 ${data.companyPhone}</div>` : ''}
          ${data.companyEmail ? `<div>✉ ${data.companyEmail}</div>` : ''}
        </div>
      </div>
      <div class="party-card">
        <div class="party-card-header">Bill To</div>
        <div class="party-card-body">
          <div class="party-name">${data.clientName}</div>
          <div>${data.clientEmail}</div>
          ${data.clientAddress ? `<div>${data.clientAddress}</div>` : ''}
          ${data.clientGSTIN ? `<div style="margin-top:6px; font-size:9.5px;">GSTIN: ${data.clientGSTIN}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="section">
      <div class="section-title">Items / Services</div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:28px;">#</th>
            <th>Description</th>
            ${!isQuotation ? '<th style="width:65px;">HSN</th>' : ''}
            <th style="width:55px;">Qty</th>
            <th style="width:75px;">Rate</th>
            <th style="width:75px;">Amount</th>
            <th style="width:45px;">Tax%</th>
            <th style="width:70px;">Tax</th>
            <th style="width:75px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    ${taxSummary}

    <!-- Bottom Section -->
    <div class="bottom-row">
      <div>${bankSection}</div>

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
        ${data.amountInWords ? `<div style="padding:6px 12px; font-size:9.5px; font-style:italic; color:#166534;">${data.amountInWords}</div>` : ''}
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


  </div>

  <!-- Footer -->
  <div class="footer-band">
    <div>${data.companyName || 'Ephorsys Pvt. Ltd'} • ${data.companyWebsite || ''}</div>
    <div>This document is computer generated.</div>
  </div>

</div>
</body>
</html>`;
}

/**
 * Generate PDF (optimized for single A4 page)
 */
export async function generateInvoicePDF(data: InvoiceData) {
  let browser;

  try {
    // Check if we are running on Vercel or in production
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      // Local development (Uses your local puppeteer)
      const localPuppeteer = require('puppeteer');
      browser = await localPuppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await browser.newPage();
    const htmlContent = buildHTML(data);

    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
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
    );

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      printBackground: true,
      preferCSSPageSize: true,
    });

    return pdf;

  } catch (error) {
    console.error('Puppeteer error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function generateQuotationPDF(data: InvoiceData) {
  return generateInvoicePDF({ ...data, type: 'quotation' });
}