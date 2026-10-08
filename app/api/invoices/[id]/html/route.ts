import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Invoice } from '@/lib/models';
import { buildHTML } from '@/lib/pdf-generator';
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

    const html = buildHTML({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date ? invoice.date.toISOString() : new Date().toISOString(),
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : undefined,
      clientName: (invoice.clientId as any)?.name || 'Valued Client',
      clientEmail: (invoice.clientId as any)?.email,
      clientAddress: (invoice.clientId as any)?.address,
      clientGSTIN: (invoice.clientId as any)?.taxNumber,
      GSTIN: (invoice.clientId as any)?.taxNumber,
      state: (invoice.clientId as any)?.city || (invoice.clientId as any)?.country,
      items: invoice.items || [],
      subtotal: invoice.subtotal || 0,
      taxableAmount: invoice.subtotal || 0,
      cgst: invoice.cgstAmount > 0 && invoice.subtotal > 0 ? (invoice.cgstAmount / invoice.subtotal) * 100 : undefined,
      sgst: invoice.sgstAmount > 0 && invoice.subtotal > 0 ? (invoice.sgstAmount / invoice.subtotal) * 100 : undefined,
      igst: invoice.igstAmount > 0 && invoice.subtotal > 0 ? (invoice.igstAmount / invoice.subtotal) * 100 : 0,
      cgstAmount: invoice.cgstAmount || 0,
      sgstAmount: invoice.sgstAmount || 0,
      igstAmount: invoice.igstAmount || 0,
      tax: invoice.tax || 0,
      total: invoice.total || 0,
      paidAmount: invoice.paidAmount,
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

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Invoice HTML route error:', error);
    return NextResponse.json({ error: 'Failed to render invoice HTML' }, { status: 500 });
  }
}
