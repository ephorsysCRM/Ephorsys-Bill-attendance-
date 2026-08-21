import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Invoice, Client } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const invoices = await Invoice.find({ userId: session.userId })
      .populate('clientId', 'name email')
      .lean();

    const invoicesWithClientName = invoices.map((inv: any) => ({
      ...inv,
      clientName: inv.clientId?.name,
    }));

    return NextResponse.json({ invoices: invoicesWithClientName });
  } catch (error) {
    console.error('Fetch invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { clientId, invoiceNumber, date, dueDate, items, notes, status, subtotal, cgstAmount, sgstAmount, igstAmount, tax, total, paidAmount, deposits } = body;

    const invoice = await Invoice.create({
      userId: session.userId,
      clientId,
      invoiceNumber,
      date: date ? new Date(date) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      items,
      notes,
      status,
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      tax,
      total,
      paidAmount,
      deposits,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}

