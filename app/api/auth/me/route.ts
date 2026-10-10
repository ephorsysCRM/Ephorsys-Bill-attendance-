import { connectDB } from '@/lib/mongodb';
import { User, Employee } from '@/lib/models';
import { verifyToken } from '@/lib/jwt';
import { NextRequest, NextResponse } from 'next/server';

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value || getCookieValue(req.headers.get('cookie'), 'token');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (session.role === 'hr') {
      const employee = await Employee.findById(session.employeeId).select('-password');

      if (!employee || employee.status === 'terminated') {
        const response = NextResponse.json(
          { error: 'Account terminated or deactivated. Please contact your administrator.' },
          { status: 401 }
        );
        response.cookies.delete('token');
        return response;
      }

      return NextResponse.json({
        success: true,
        user: {
          id: employee._id,
          userId: employee.userId,
          email: employee.email,
          name: employee.name,
          role: 'hr',
          empId: employee.empId,
          designation: employee.designation,
          status: employee.status,
        },
      });
    }

    // Default: Admin
    const user = await User.findById(session.userId).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

