import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Settings } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'hr') {
      return NextResponse.json({ error: 'Forbidden: HR accounts cannot access settings.' }, { status: 403 });
    }

    await connectDB();

    const settings = await Settings.findOne({ userId: session.userId });

    if (!settings) {
      const defaultSettings = await Settings.create({
        userId: session.userId,
        taxRate: 0,
        currency: 'INR',
        language: 'en',
        theme: 'dark',
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'hr') {
      return NextResponse.json({ error: 'Forbidden: HR accounts cannot modify settings.' }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();

    const settings = await Settings.findOneAndUpdate(
      { userId: session.userId },
      body,
      { new: true, upsert: true }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
