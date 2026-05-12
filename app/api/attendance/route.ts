import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Attendance } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

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
      const date = new Date(dateStr);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    } else if (!employeeId) {
      return NextResponse.json({ error: 'Date or Date range is required' }, { status: 400 });
    }

    const attendance = await Attendance.find(query).sort({ date: 1 }).lean();

    return NextResponse.json({ attendance });
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
    const { date, records } = body;

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Delete existing records for this day to overwrite
    await Attendance.deleteMany({
      userId: session.userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const attendanceRecords = records.map((record: any) => ({
      userId: session.userId,
      employeeId: record.employeeId,
      date: attendanceDate,
      status: record.status,
      notes: record.notes,
    }));

    const result = await Attendance.insertMany(attendanceRecords);

    return NextResponse.json({ success: true, count: result.length });
  } catch (error: any) {
    console.error('Save attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}
