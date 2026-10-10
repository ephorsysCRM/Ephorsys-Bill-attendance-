import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User, PasswordReset } from '@/lib/models';
import { hashPassword, verifyPassword } from '@/lib/password';
import { verifyResetToken, validatePasswordStrength } from '@/lib/security-otp';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { sendPasswordResetSuccessEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. IP rate limiting (Max 8 attempts per 15 minutes per IP)
    const ipRateLimit = checkRateLimit({
      key: `reset-password-ip:${ip}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many password reset requests from this network. Please try again in ${ipRateLimit.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const resetToken = typeof body.resetToken === 'string' ? body.resetToken.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

    if (!rawEmail || !resetToken || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    // 2. Validate strict password policy
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        {
          error: strength.errors[0] || 'Password does not meet the security criteria.',
          details: strength.errors,
        },
        { status: 400 }
      );
    }

    await connectDB();

    // 3. Find verified reset record
    const record = await PasswordReset.findOne({ email: rawEmail });

    if (!record || !record.isVerified || !record.resetTokenHash || !record.resetTokenExpiresAt) {
      return NextResponse.json(
        {
          error: 'Your password reset session has expired or is invalid. Please request a new verification code.',
        },
        { status: 400 }
      );
    }

    // Check token expiry
    if (new Date() > new Date(record.resetTokenExpiresAt)) {
      await PasswordReset.deleteMany({ email: rawEmail });
      return NextResponse.json(
        {
          error: 'Your reset authorization has expired. Please restart the forgot password process.',
        },
        { status: 400 }
      );
    }

    // Timing-safe comparison of reset token
    const isTokenValid = verifyResetToken(resetToken, record.resetTokenHash);
    if (!isTokenValid) {
      return NextResponse.json(
        { error: 'Invalid or forged reset token.' },
        { status: 400 }
      );
    }

    // 4. Find the user
    const user = await User.findOne({ email: rawEmail });
    if (!user) {
      await PasswordReset.deleteMany({ email: rawEmail });
      return NextResponse.json(
        { error: 'Account not found.' },
        { status: 404 }
      );
    }

    // 5. Prevent reusing identical existing password
    const isSamePassword = await verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Your new password cannot be the same as your previous password.' },
        { status: 400 }
      );
    }

    // 6. Hash new password securely with PBKDF2 salt
    const hashedPassword = await hashPassword(newPassword);
    await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

    // 7. Revoke and completely purge reset records (Single-use guarantee)
    await PasswordReset.deleteMany({ email: rawEmail });

    // 8. Send confirmation email to alert the user of password change
    sendPasswordResetSuccessEmail(user.email, user.name).catch((err) => {
      console.error('Failed to dispatch password changed confirmation email:', err);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your password has been changed successfully. You can now log in.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
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
