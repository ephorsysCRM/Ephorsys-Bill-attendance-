import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Employee, Attendance } from '@/lib/models';
import { hashPassword } from '@/lib/password';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Do NOT leak the password hash
    const employees = await Employee.find({ userId: session.userId })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

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

    // Only Admin can create employees or assign HR credentials
    if (session.role === 'hr') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can create employees or provision HR accounts.' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const {
      name,
      empId,
      designation,
      empType = 'Full-time',
      email,
      password,
      role = 'employee',
      status = 'active',
    } = body;

    if (!name || !empId || !designation) {
      return NextResponse.json(
        { error: 'Name, Employee ID, and Designation are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    // If email is provided, check for uniqueness
    if (cleanEmail) {
      const existing = await Employee.findOne({ email: cleanEmail });
      if (existing) {
        return NextResponse.json(
          { error: 'An employee or HR account with this email already exists.' },
          { status: 400 }
        );
      }
    }

    // If role is HR, email and password should be provided
    if (role === 'hr' && (!cleanEmail || !password)) {
      return NextResponse.json(
        { error: 'Email and password are required to create an HR account.' },
        { status: 400 }
      );
    }

    let hashedPassword: string | undefined = undefined;
    if (password && password.trim()) {
      hashedPassword = await hashPassword(password.trim());
    }

    const employee = await Employee.create({
      userId: session.userId,
      name: name.trim(),
      empId: empId.trim(),
      designation: designation.trim(),
      empType,
      email: cleanEmail,
      password: hashedPassword,
      role,
      status,
    });

    const responseData = employee.toObject();
    delete responseData.password;

    return NextResponse.json(responseData, { status: 201 });
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

    // Only Admin can edit credentials or terminate accounts
    if (session.role === 'hr') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can modify employee details or credentials.' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { _id, password, terminateCredentials, ...updateFields } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Employee ID is required.' }, { status: 400 });
    }

    const employee = await Employee.findOne({ _id, userId: session.userId });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
    }

    // Email duplicate check
    if (updateFields.email !== undefined) {
      const cleanEmail = updateFields.email ? updateFields.email.trim().toLowerCase() : undefined;
      if (cleanEmail) {
        const existing = await Employee.findOne({
          email: cleanEmail,
          _id: { $ne: _id },
        });
        if (existing) {
          return NextResponse.json(
            { error: 'Another account already uses this email.' },
            { status: 400 }
          );
        }
        updateFields.email = cleanEmail;
      } else {
        updateFields.email = undefined;
      }
    }

    // Handle password update
    if (password && typeof password === 'string' && password.trim()) {
      updateFields.password = await hashPassword(password.trim());
    }

    // Handle revoking / terminating credentials
    if (terminateCredentials === true) {
      updateFields.password = undefined;
      updateFields.status = 'terminated';
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id, userId: session.userId },
      { $set: updateFields },
      { new: true }
    ).select('-password');

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error('Update employee error:', error);
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

    if (session.role === 'hr') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can delete employees.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required.' }, { status: 400 });
    }

    await connectDB();

    const employee = await Employee.findOneAndDelete({ _id: id, userId: session.userId });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
    }

    // Clean up attendance records for this employee
    await Attendance.deleteMany({ employeeId: id, userId: session.userId });

    return NextResponse.json({ success: true, message: 'Employee and attendance records deleted.' });
  } catch (error: any) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
