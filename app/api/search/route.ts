import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Client, Invoice, Quotation, Employee } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      return NextResponse.json({
        invoices: [],
        quotations: [],
        clients: [],
        employees: [],
      });
    }

    await connectDB();

    const safePattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safePattern, 'i');

    // If user is HR, only allow searching employees
    if (session.role === 'hr') {
      const employees = await Employee.find({
        userId: session.userId,
        $or: [
          { name: regex },
          { empId: regex },
          { designation: regex },
          { empType: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('_id name empId designation empType')
        .lean();

      return NextResponse.json({
        invoices: [],
        quotations: [],
        clients: [],
        employees: employees.map((emp: any) => ({
          id: emp._id.toString(),
          name: emp.name,
          empId: emp.empId,
          designation: emp.designation,
          empType: emp.empType,
        })),
      });
    }

    // 1. First find clients matching the name to include in invoice/quotation lookup
    const matchingClients = await Client.find({
      userId: session.userId,
      name: regex,
    })
      .select('_id')
      .lean();

    const matchingClientIds = matchingClients.map((c: any) => c._id);

    // 2. Query collections concurrently
    const [invoices, quotations, clients, employees] = await Promise.all([
      Invoice.find({
        userId: session.userId,
        $or: [
          { invoiceNumber: regex },
          { notes: regex },
          { status: regex },
          ...(matchingClientIds.length > 0 ? [{ clientId: { $in: matchingClientIds } }] : []),
        ],
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('clientId', 'name email')
        .select('_id invoiceNumber date total status clientId')
        .lean(),

      Quotation.find({
        userId: session.userId,
        $or: [
          { quotationNumber: regex },
          { notes: regex },
          { status: regex },
          ...(matchingClientIds.length > 0 ? [{ clientId: { $in: matchingClientIds } }] : []),
        ],
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('clientId', 'name email')
        .select('_id quotationNumber date total status clientId')
        .lean(),

      Client.find({
        userId: session.userId,
        $or: [
          { name: regex },
          { email: regex },
          { phone: regex },
          { city: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('_id name email phone city')
        .lean(),

      Employee.find({
        userId: session.userId,
        $or: [
          { name: regex },
          { empId: regex },
          { designation: regex },
          { empType: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('_id name empId designation empType')
        .lean(),
    ]);

    const formattedInvoices = invoices.map((inv: any) => ({
      id: inv._id.toString(),
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientId?.name || 'Unknown Client',
      total: inv.total || 0,
      status: inv.status || 'draft',
      date: inv.date,
    }));

    const formattedQuotations = quotations.map((q: any) => ({
      id: q._id.toString(),
      quotationNumber: q.quotationNumber,
      clientName: q.clientId?.name || 'Unknown Client',
      total: q.total || 0,
      status: q.status || 'draft',
      date: q.date,
    }));

    const formattedClients = clients.map((c: any) => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      city: c.city || '',
    }));

    const formattedEmployees = employees.map((emp: any) => ({
      id: emp._id.toString(),
      name: emp.name,
      empId: emp.empId,
      designation: emp.designation,
      empType: emp.empType,
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      quotations: formattedQuotations,
      clients: formattedClients,
      employees: formattedEmployees,
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
