import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Invoice } from '@/lib/models';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const invoice = await Invoice.findOne({
      _id: resolvedParams.id,
      userId: session.userId,
    }).populate('clientId');

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date.toISOString(),
      dueDate: invoice.dueDate?.toISOString(),
      clientName: (invoice.clientId as any)?.name || 'Unknown',
      clientEmail: (invoice.clientId as any)?.email,
      clientAddress: (invoice.clientId as any)?.address,
      items: invoice.items,
      subtotal: invoice.subtotal, 
      taxableAmount: invoice.subtotal,
      igst: invoice.igstAmount > 0 ? ((invoice.igstAmount / invoice.subtotal) * 100) : 0,
      cgstAmount: invoice.cgstAmount,
      sgstAmount: invoice.sgstAmount,
      igstAmount: invoice.igstAmount,
      tax: invoice.tax,
      total: invoice.total,
      notes: invoice.notes,
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
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Generate PDF error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
