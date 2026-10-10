import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { PasswordReset } from '@/lib/models';
import { verifyOtp, generateResetToken, hashResetToken } from '@/lib/security-otp';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. IP rate limiting (Max 15 OTP verification attempts per 15 minutes per IP)
    const ipRateLimit = checkRateLimit({
      key: `verify-otp-ip:${ip}`,
      limit: 15,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many verification attempts from this IP. Please try again in ${ipRateLimit.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const rawOtp = typeof body.otp === 'string' ? body.otp.trim() : '';

    if (!rawEmail || !rawOtp) {
      return NextResponse.json(
        { error: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    // OTP must be exactly 6 digits
    if (!/^\d{6}$/.test(rawOtp)) {
      return NextResponse.json(
        { error: 'Verification code must be exactly 6 numeric digits.' },
        { status: 400 }
      );
    }

    await connectDB();

    const record = await PasswordReset.findOne({ email: rawEmail });

    if (!record) {
      return NextResponse.json(
        { error: 'Verification session expired or does not exist. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > new Date(record.expiresAt)) {
      await PasswordReset.deleteOne({ _id: record._id });
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (record.isVerified) {
      return NextResponse.json(
        { error: 'This code has already been verified. Proceed to set your new password.' },
        { status: 400 }
      );
    }

    // Check attempt lockout
    if (record.attempts >= record.maxAttempts) {
      await PasswordReset.deleteOne({ _id: record._id });
      return NextResponse.json(
        {
          error: 'Too many incorrect attempts. For security reasons, this code has been permanently invalidated. Please request a new code.',
        },
        { status: 429 }
      );
    }

    // Safety check for salt and otpHash
    if (!record.salt || !record.otpHash) {
      return NextResponse.json(
        { error: 'Invalid verification session state. Please request a new code.' },
        { status: 400 }
      );
    }

    // Constant-time OTP comparison
    const isValid = verifyOtp(rawOtp, record.salt, record.otpHash);

    if (!isValid) {
      const updatedAttempts = (record.attempts || 0) + 1;
      const remaining = record.maxAttempts - updatedAttempts;

      if (remaining <= 0) {
        await PasswordReset.deleteOne({ _id: record._id });
        return NextResponse.json(
          {
            error: 'Maximum attempts exceeded. This code has been invalidated. Please request a new one.',
          },
          { status: 400 }
        );
      }

      await PasswordReset.updateOne(
        { _id: record._id },
        { $inc: { attempts: 1 } }
      );

      return NextResponse.json(
        {
          error: `Invalid verification code. You have ${remaining} attempt(s) remaining.`,
          remainingAttempts: remaining,
        },
        { status: 400 }
      );
    }

    // OTP is valid! Issue a secure one-time reset token
    const resetToken = generateResetToken();
    const resetTokenHash = hashResetToken(resetToken);
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Atomic update in MongoDB to avoid Mongoose schema validation edge cases
    await PasswordReset.updateOne(
      { _id: record._id },
      {
        $set: {
          isVerified: true,
          resetTokenHash,
          resetTokenExpiresAt,
          otpHash: 'VERIFIED',
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Code verified successfully.',
        resetToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    const errorMessage =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : 'An unexpected internal error occurred. Please try again.';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
