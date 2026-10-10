import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Quotation } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'hr') {
      return NextResponse.json({ error: 'Forbidden: HR accounts cannot access quotations.' }, { status: 403 });
    }

    await connectDB();

    const quotations = await Quotation.find({ userId: session.userId })
      .populate('clientId', 'name email')
      .lean();

    const quotationsWithClientName = quotations.map((q: any) => ({
      ...q,
      clientName: q.clientId?.name,
    }));

    return NextResponse.json({ quotations: quotationsWithClientName });
  } catch (error) {
    console.error('Fetch quotations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'hr') {
      return NextResponse.json({ error: 'Forbidden: HR accounts cannot create quotations.' }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();
    const { clientId, quotationNumber, date, dueDate, items, notes, status, subtotal, cgstAmount, sgstAmount, igstAmount, tax, total } = body;

    const quotation = await Quotation.create({
      userId: session.userId,
      clientId,
      quotationNumber,
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
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error('Create quotation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}

