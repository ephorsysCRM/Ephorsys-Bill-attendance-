import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Client } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'hr') {
      return NextResponse.json({ error: 'Forbidden: HR accounts cannot access clients.' }, { status: 403 });
    }

    await connectDB();

    const clients = await Client.find({ userId: session.userId }).lean();

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Fetch clients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === 'hr') {
      return NextResponse.json({ error: 'Forbidden: HR accounts cannot create clients.' }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();
    
    // Explicitly set userId and remove it from body if it exists there
    const { userId, ...clientData } = body;

    const client = await Client.create({
      ...clientData,
      userId: session.userId,
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error('Create client error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}

