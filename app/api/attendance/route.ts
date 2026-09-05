import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Attendance, Employee } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

function getDateSearchRange(dateStr: string) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  // Normalized UTC date for storage
  const utcMidnight = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  // Wide search range covering local timezone offsets (-14h to +14h)
  const rangeStart = new Date(Date.UTC(y, m - 1, d - 1, 10, 0, 0, 0));
  const rangeEnd = new Date(Date.UTC(y, m - 1, d + 1, 14, 0, 0, 0));
  return { utcMidnight, rangeStart, rangeEnd };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const query: any = { userId: session.userId };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (dateStr) {
      const { rangeStart, rangeEnd } = getDateSearchRange(dateStr);
      query.date = { $gte: rangeStart, $lte: rangeEnd };
    } else if (startDateStr && endDateStr) {
      const { rangeStart } = getDateSearchRange(startDateStr);
      const { rangeEnd } = getDateSearchRange(endDateStr);
      query.date = { $gte: rangeStart, $lte: rangeEnd };
    } else if (!employeeId) {
      return NextResponse.json({ error: 'Date or Date range is required' }, { status: 400 });
    }

    const rawAttendance = await Attendance.find(query).sort({ date: 1 }).lean();

    // If single date queried, strictly filter to this calendar day
    let attendance = rawAttendance;
    if (dateStr) {
      attendance = rawAttendance.filter((rec) => {
        const d = new Date(rec.date);
        const utcKey = d.toISOString().slice(0, 10);
        const localKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return utcKey === dateStr || localKey === dateStr;
      });
    }

    // Determine if the entire day is marked as Holiday
    const isHoliday = attendance.length > 0 && attendance.every((r: any) => r.status === 'holiday');

    return NextResponse.json({ attendance, isHoliday });
  } catch (error) {
    console.error('Fetch attendance error:', error);
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
    const { date, records, isHoliday, employeeId, status, notes } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const { utcMidnight, rangeStart, rangeEnd } = getDateSearchRange(date);

    // 1. If admin is marking the entire day as a Holiday for ALL employees
    if (isHoliday === true || status === 'holiday-all') {
      const employees = await Employee.find({ userId: session.userId }).lean();

      // Clear existing records for this day
      await Attendance.deleteMany({
        userId: session.userId,
        date: { $gte: rangeStart, $lte: rangeEnd },
      });

      const holidayRecords = employees.map((emp) => ({
        userId: session.userId,
        employeeId: emp._id,
        date: utcMidnight,
        status: 'holiday',
        notes: notes || 'Company Holiday',
      }));

      const result = holidayRecords.length > 0 
        ? await Attendance.insertMany(holidayRecords)
        : [];

      return NextResponse.json({ 
        success: true, 
        isHoliday: true, 
        count: result.length,
        attendance: result
      });
    }

    // 2. Support single employee record update/remove
    if (employeeId) {
      await Attendance.deleteMany({
        userId: session.userId,
        employeeId,
        date: { $gte: rangeStart, $lte: rangeEnd },
      });

      if (status && status !== 'none') {
        const newRecord = await Attendance.create({
          userId: session.userId,
          employeeId,
          date: utcMidnight,
          status,
          notes: notes || '',
        });
        return NextResponse.json({ success: true, record: newRecord });
      }

      return NextResponse.json({ success: true, message: 'Attendance removed' });
    }

    // 3. Support bulk records for a date
    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Delete existing records for this day to overwrite cleanly
    await Attendance.deleteMany({
      userId: session.userId,
      date: { $gte: rangeStart, $lte: rangeEnd },
    });

    const validRecords = records.filter((r: any) => r.status && r.status !== 'none');
    const attendanceRecords = validRecords.map((r: any) => ({
      userId: session.userId,
      employeeId: r.employeeId,
      date: utcMidnight,
      status: r.status,
      notes: r.notes || '',
    }));

    const result = attendanceRecords.length > 0
      ? await Attendance.insertMany(attendanceRecords)
      : [];

    const allAreHoliday = result.length > 0 && result.every((r) => r.status === 'holiday');

    return NextResponse.json({ 
      success: true, 
      count: result.length, 
      isHoliday: allAreHoliday,
      attendance: result 
    });
  } catch (error: any) {
    console.error('Save attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const dateStr = searchParams.get('date');
    const id = searchParams.get('id');

    if (id) {
      await Attendance.findOneAndDelete({ _id: id, userId: session.userId });
      return NextResponse.json({ success: true, message: 'Record deleted' });
    }

    if (dateStr) {
      const { rangeStart, rangeEnd } = getDateSearchRange(dateStr);

      if (employeeId) {
        await Attendance.deleteMany({
          userId: session.userId,
          employeeId,
          date: { $gte: rangeStart, $lte: rangeEnd },
        });
        return NextResponse.json({ success: true, message: 'Employee attendance removed' });
      } else {
        // Clear all attendance for this day (e.g. unmark holiday for all)
        await Attendance.deleteMany({
          userId: session.userId,
          date: { $gte: rangeStart, $lte: rangeEnd },
        });
        return NextResponse.json({ success: true, message: 'Date attendance cleared for all employees' });
      }
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('Delete attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}
