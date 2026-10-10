import { connectDB } from '@/lib/mongodb';
import { User, Employee } from '@/lib/models';
import { createToken } from '@/lib/jwt';
import { verifyPassword } from '@/lib/password';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const { email, password, loginType = 'admin' } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ==========================================
    // 1. HR LOGIN FLOW
    // ==========================================
    if (loginType === 'hr') {
      const employee = await Employee.findOne({ email: normalizedEmail });

      if (!employee) {
        return NextResponse.json(
          { error: 'Invalid credentials. No HR account found with this email.' },
          { status: 401 }
        );
      }

      if (employee.role !== 'hr') {
        return NextResponse.json(
          { error: 'Access denied. This account does not have HR authorization.' },
          { status: 403 }
        );
      }

      if (employee.status === 'terminated') {
        return NextResponse.json(
          { error: 'This HR account has been terminated by the administrator. Access revoked.' },
          { status: 403 }
        );
      }

      if (!employee.password) {
        return NextResponse.json(
          { error: 'Login credentials have not been configured for this account. Contact your administrator.' },
          { status: 401 }
        );
      }

      const isPasswordValid = await verifyPassword(password, employee.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid credentials for HR account.' }, { status: 401 });
      }

      // Create JWT token for HR (attaches admin's userId for attendance access)
      const token = createToken({
        userId: employee.userId.toString(),
        employeeId: employee._id.toString(),
        email: employee.email!,
        role: 'hr',
        name: employee.name,
      });

      const response = NextResponse.json(
        {
          success: true,
          user: {
            id: employee._id,
            email: employee.email,
            name: employee.name,
            role: 'hr',
          },
          redirectUrl: '/dashboard/attendance',
        },
        { status: 200 }
      );

      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    // ==========================================
    // 2. ADMIN LOGIN FLOW
    // ==========================================
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Check if user accidentally tried to log in with HR credentials in Admin tab
      const isHrAccount = await Employee.findOne({ email: normalizedEmail, role: 'hr' });
      if (isHrAccount) {
        return NextResponse.json(
          { error: 'This is an HR account. Please switch to the "HR Portal" tab to sign in.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    // Check password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    // Create token
    const token = createToken({
      userId: user._id.toString(),
      email: user.email,
      role: 'admin',
      name: user.name,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: 'admin',
        },
        redirectUrl: '/dashboard',
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
