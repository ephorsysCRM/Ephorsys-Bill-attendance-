import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    return payload;
  } catch {
    return null;
  }
}

export function withAuth(handler: (req: NextRequest, { params }: { params: any }, session: JWTPayload) => Promise<Response>) {
  return async (req: NextRequest, { params }: { params: any }) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const session = verifyToken(token);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return handler(req, { params }, session);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  };
}
