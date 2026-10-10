import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Invoice, Quotation, Client } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'hr') {
      return NextResponse.json({ error: 'Forbidden: HR accounts do not have access to financial statistics.' }, { status: 403 });
    }

    await connectDB();

    const [invoices, quotations, clients] = await Promise.all([
      Invoice.find({ userId: session.userId }),
      Quotation.find({ userId: session.userId }),
      Client.find({ userId: session.userId }),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    return NextResponse.json({
      totalInvoices: invoices.length,
      totalQuotations: quotations.length,
      totalClients: clients.length,
      totalRevenue,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
