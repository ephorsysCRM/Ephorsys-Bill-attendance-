import { createHash, randomBytes } from 'crypto';

// Simple PBKDF2-like password hashing using built-in crypto
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const iterations = 100000;
  
  let hash = password;
  for (let i = 0; i < iterations; i++) {
    hash = createHash('sha256').update(hash + salt).digest('hex');
  }
  
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const [salt, hash] = hashedPassword.split(':');
    const iterations = 100000;
    
    let computedHash = password;
    for (let i = 0; i < iterations; i++) {
      computedHash = createHash('sha256').update(computedHash + salt).digest('hex');
    }
    
    return computedHash === hash;
  } catch {
    return false;
  }
}
