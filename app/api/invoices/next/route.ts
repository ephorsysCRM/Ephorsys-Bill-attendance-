import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Invoice } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function parseSequenceNumber(code: string) {
  // Try new format first: INVEPH-005/04/2026
  let match = code.match(/-(\d+)\//);
  if (match) return parseInt(match[1], 10);
  
  // Fallback to old format: INV-001
  match = code.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

function formatInvoiceNumber(sequence: number) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `INVEPH-${String(sequence).padStart(3, '0')}/${month}/${year}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthStr = String(currentMonth).padStart(2, '0');
    const yearStr = currentYear.toString();

    // Find invoices for current month/year
    const currentMonthInvoices = await Invoice.find({
      userId: session.userId,
      invoiceNumber: new RegExp(`/${monthStr}/${yearStr}$`)
    }).select('invoiceNumber').lean();

    const nextSequence = currentMonthInvoices.reduce((max, invoice: any) => {
      const number = parseSequenceNumber(invoice.invoiceNumber);
      if (number && number > max) {
        return number;
      }
      return max;
    }, 0) + 1;

    return NextResponse.json({ nextInvoiceNumber: formatInvoiceNumber(nextSequence) });
  } catch (error) {
    console.error('Fetch next invoice number error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
