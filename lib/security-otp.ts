import crypto from 'crypto';

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 * Uses crypto.randomInt which is backed by system entropy (CSPRNG).
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generate a cryptographically secure random salt for OTP hashing.
 */
export function generateOtpSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash an OTP using HMAC-SHA256 with a secret key and unique per-OTP salt.
 * Even if the database is compromised, plaintext OTPs cannot be recovered.
 */
export function hashOtp(otp: string, salt: string): string {
  const secret = process.env.JWT_SECRET || 'ephorsys-secure-otp-secret-salt-2026';
  return crypto
    .createHmac('sha256', secret)
    .update(`${otp}:${salt}`)
    .digest('hex');
}

/**
 * Timing-safe comparison of provided OTP with the stored hash.
 * Protects against side-channel timing attacks.
 */
export function verifyOtp(inputOtp: string, salt: string, expectedHash: string): boolean {
  try {
    const computedHash = hashOtp(inputOtp, salt);
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (computedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate a high-entropy 256-bit one-time reset token.
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash the reset token using SHA-256 before saving to the database.
 */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Timing-safe comparison of provided reset token with stored hash.
 */
export function verifyResetToken(token: string, expectedHash: string): boolean {
  try {
    const computedHash = hashResetToken(token);
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (computedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Strict password strength validation.
 * Enforces enterprise-grade security for administrative accounts.
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
  score: number; // 0 to 4
} {
  const errors: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter (a-z)');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter (A-Z)');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one number (0-9)');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Password must include at least one special character (!@#$%^&*)');
  } else {
    score += 1;
  }

  return {
    valid: errors.length === 0,
    errors,
    score,
  };
}

/**
 * Mask email for secure UI display (e.g. j***e@example.com).
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'your email';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}
