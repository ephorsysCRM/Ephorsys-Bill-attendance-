import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Employee } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const employees = await Employee.find({ userId: session.userId }).lean();

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Fetch employees error:', error);
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
    
    const { userId, ...employeeData } = body;

    const employee = await Employee.create({
      ...employeeData,
      userId: session.userId,
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const employee = await Employee.findOneAndUpdate(
      { _id, userId: session.userId },
      updateData,
      { new: true }
    );

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error: any) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}
