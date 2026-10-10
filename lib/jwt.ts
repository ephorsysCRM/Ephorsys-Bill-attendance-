import { createHmac } from 'crypto';

const SECRET = process.env.JWT_SECRET || 'ephorsys-default-secret-2024-change-in-prod';

export interface JWTPayload {
  userId: string;
  employeeId?: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  name?: string;
  iat?: number;
  exp?: number;
}

function base64url(buf: Buffer | string): string {
  const str = typeof buf === 'string' ? Buffer.from(buf).toString('base64') : buf.toString('base64');
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error('Invalid base64url string');
    }
    str += new Array(5 - pad).join('=');
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = base64url(JSON.stringify({ ...payload, iat: now, exp: now + 604800 }));
  
  const signature = base64url(
    createHmac('sha256', SECRET).update(`${header}.${fullPayload}`).digest('base64')
  );
  
  return `${header}.${fullPayload}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSig = base64url(
      createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64')
    );

    if (signature !== expectedSig) return null;

    const decoded = JSON.parse(base64urlDecode(payload)) as JWTPayload;
    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < now) return null;

    return decoded;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64urlDecode(parts[1])) as JWTPayload;
  } catch {
    return null;
  }
}
