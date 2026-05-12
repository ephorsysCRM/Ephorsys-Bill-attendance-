import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Quotation } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

function parseSequenceNumber(code: string) {
  // Try new format first: QTEPH-002/03/2026
  let match = code.match(/-(\d+)\//);
  if (match) return parseInt(match[1], 10);
  
  // Fallback to old format: QT-001
  match = code.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

function formatQuotationNumber(sequence: number) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `QTEPH-${String(sequence).padStart(3, '0')}/${month}/${year}`;
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

    // Find quotations for current month/year
    const currentMonthQuotations = await Quotation.find({
      userId: session.userId,
      quotationNumber: new RegExp(`/${monthStr}/${yearStr}$`)
    }).select('quotationNumber').lean();

    const nextSequence = currentMonthQuotations.reduce((max, quotation: any) => {
      const number = parseSequenceNumber(quotation.quotationNumber);
      if (number && number > max) {
        return number;
      }
      return max;
    }, 0) + 1;

    return NextResponse.json({ nextQuotationNumber: formatQuotationNumber(nextSequence) });
  } catch (error) {
    console.error('Fetch next quotation number error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
