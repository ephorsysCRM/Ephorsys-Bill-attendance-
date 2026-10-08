import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Quotation } from '@/lib/models';
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

    const quotation = await Quotation.findOne({
      _id: resolvedParams.id,
      userId: session.userId,
    }).populate('clientId');

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const html = buildHTML({
      invoiceNumber: quotation.quotationNumber,
      date: quotation.date ? quotation.date.toISOString() : new Date().toISOString(),
      dueDate: quotation.dueDate ? quotation.dueDate.toISOString() : undefined,
      validUntil: quotation.dueDate ? quotation.dueDate.toISOString() : undefined,
      type: 'quotation',
      status: quotation.status,
      clientName: (quotation.clientId as any)?.name || 'Valued Client',
      clientEmail: (quotation.clientId as any)?.email,
      clientAddress: (quotation.clientId as any)?.address,
      clientGSTIN: (quotation.clientId as any)?.taxNumber,
      GSTIN: (quotation.clientId as any)?.taxNumber,
      state: (quotation.clientId as any)?.city || (quotation.clientId as any)?.country,
      items: quotation.items || [],
      subtotal: quotation.subtotal || 0,
      taxableAmount: quotation.subtotal || 0,
      cgst: quotation.cgstAmount > 0 && quotation.subtotal > 0 ? (quotation.cgstAmount / quotation.subtotal) * 100 : undefined,
      sgst: quotation.sgstAmount > 0 && quotation.subtotal > 0 ? (quotation.sgstAmount / quotation.subtotal) * 100 : undefined,
      igst: quotation.igstAmount > 0 && quotation.subtotal > 0 ? (quotation.igstAmount / quotation.subtotal) * 100 : 0,
      cgstAmount: quotation.cgstAmount || 0,
      sgstAmount: quotation.sgstAmount || 0,
      igstAmount: quotation.igstAmount || 0,
      tax: quotation.tax || 0,
      total: quotation.total || 0,
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

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Quotation HTML route error:', error);
    return NextResponse.json({ error: 'Failed to render quotation HTML' }, { status: 500 });
  }
}
