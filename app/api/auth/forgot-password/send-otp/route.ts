import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User, PasswordReset } from '@/lib/models';
import { generateSecureOtp, generateOtpSalt, hashOtp } from '@/lib/security-otp';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { sendOtpEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. Enforce IP-based rate limiting (Max 6 requests per 15 minutes per IP)
    const ipRateLimit = checkRateLimit({
      key: `send-otp-ip:${ip}`,
      limit: 6,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many requests from this network. Please try again in ${ipRateLimit.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // 2. Enforce per-email rate limiting (Max 5 requests per hour)
    const emailHourlyLimit = checkRateLimit({
      key: `send-otp-email-hourly:${rawEmail}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!emailHourlyLimit.success) {
      return NextResponse.json(
        {
          error: `Too many OTP requests for this email. Please try again in ${Math.ceil(emailHourlyLimit.resetInSeconds / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    await connectDB();

    // Check if an existing reset record was created within the 60-second cooldown period
    const existingReset = await PasswordReset.findOne({ email: rawEmail });
    if (existingReset && existingReset.lastRequestedAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existingReset.lastRequestedAt).getTime()) / 1000);
      const COOLDOWN_SECONDS = 60;
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remainingSeconds = COOLDOWN_SECONDS - elapsedSeconds;
        return NextResponse.json(
          {
            error: `Please wait ${remainingSeconds} second(s) before requesting a new code.`,
            retryAfter: remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    // Look up user
    const user = await User.findOne({ email: rawEmail });

    // Anti-Enumeration Defense:
    // If user does NOT exist, do NOT disclose. Simulate delay and return generic success.
    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, a verification code has been dispatched.',
          cooldownSeconds: 60,
        },
        { status: 200 }
      );
    }

    // Generate cryptographic OTP and salt
    const otp = generateSecureOtp();
    const salt = generateOtpSalt();
    const otpHash = hashOtp(otp, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Invalidate any previous OTP records for this email
    await PasswordReset.deleteMany({ email: rawEmail });

    // Store secure hashed OTP record
    await PasswordReset.create({
      email: rawEmail,
      otpHash,
      salt,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      lastRequestedAt: new Date(),
      isVerified: false,
    });

    // Send email using Nodemailer
    try {
      await sendOtpEmail(user.email, otp, user.name);
    } catch (mailErr) {
      console.error('Mail delivery failure:', mailErr);
      return NextResponse.json(
        {
          error: 'Failed to send verification email. Please verify SMTP settings or try again later.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, a verification code has been dispatched.',
        cooldownSeconds: 60,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
