import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Quotation } from '@/lib/models';
import { generateInvoicePDF } from '@/lib/pdf-generator'; // Can reuse but with quotation labeling
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const quotation = await Quotation.findOne({
      _id: resolvedParams.id,
      userId: session.userId,
    }).populate('clientId');

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: quotation.quotationNumber,
      date: quotation.date.toISOString(),
      dueDate: quotation.dueDate?.toISOString(),
      clientName: (quotation.clientId as any)?.name || 'Unknown',
      clientEmail: (quotation.clientId as any)?.email,
      clientAddress: (quotation.clientId as any)?.address,
      clientGSTIN: (quotation.clientId as any)?.taxNumber,
      GSTIN: (quotation.clientId as any)?.taxNumber,
      items: quotation.items,
      subtotal: quotation.subtotal,
      taxableAmount: quotation.subtotal,
      cgst: 0,
      sgst: 0,
      igst: quotation.igstAmount > 0 ? 18 : 0, // Assuming 18% IGST
      cgstAmount: quotation.cgstAmount,
      sgstAmount: quotation.sgstAmount,
      igstAmount: quotation.igstAmount,
      tax: quotation.tax,
      total: quotation.total,
      notes: quotation.notes,
      companyName: 'Ephorsys Private Limited',
      companyEmail: 'business@ephorsys.com',
      companyAddress: 'FIRST FLOOR, K-8/733, Kalinganagar, Bhubaneswar, Odisha, 751003',
      companyPhone: '6370238030',
      companyGST: '21AAJCE2865M1ZF',
      companyAccountName: 'Ephorsys Private Limited',
      companyBankName: 'AXIS BANK',
      companyAccountNumber: '925020050969283',
      companyIFSC: 'UTIB0000381',
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Generate PDF error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
