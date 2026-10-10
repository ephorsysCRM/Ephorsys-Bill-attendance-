'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { maskEmail } from '@/lib/security-otp';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Timers
  const [cooldown, setCooldown] = useState(0);
  const [otpTimeLeft, setOtpTimeLeft] = useState(600); // 10 minutes in seconds

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // OTP expiration countdown
  useEffect(() => {
    if (step !== 'otp' || otpTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          setError('The verification code has expired. Please request a new one.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, otpTimeLeft]);

  // Format MM:SS for timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Password criteria verification
  const passwordCriteria = {
    length: newPassword.length >= 8,
    upperAndLower: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isPasswordValid =
    passwordCriteria.length &&
    passwordCriteria.upperAndLower &&
    passwordCriteria.number &&
    passwordCriteria.special &&
    passwordCriteria.match;

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldown > 0) return;

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code. Please try again.');
        if (data.retryAfter) {
          setCooldown(data.retryAfter);
        }
        return;
      }

      setCooldown(data.cooldownSeconds || 60);
      setOtpTimeLeft(600); // 10 minutes
      setRemainingAttempts(null);
      setOtp('');
      setStep('otp');
      setInfoMessage('A 6-digit verification code has been dispatched to your email.');
    } catch (err) {
      console.error(err);
      setError('Network or server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid verification code.');
        if (typeof data.remainingAttempts === 'number') {
          setRemainingAttempts(data.remainingAttempts);
        }
        return;
      }

      setResetToken(data.resetToken);
      setStep('password');
      setInfoMessage('Verification confirmed. Please establish your new secure password.');
    } catch (err) {
      console.error(err);
      setError('Error verifying code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError('Please fulfill all password security requirements.');
      return;
    }

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update password.');
        return;
      }

      setStep('success');
    } catch (err) {
      console.error(err);
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-between">
      {/* Background Graphic */}
      <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png')] bg-cover bg-center bg-no-repeat" />
      <div className="absolute inset-0 bg-black/75" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/85 via-black/85 to-slate-950/90" />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-xl">
          
          {/* Card Container */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-xl shadow-2xl shadow-emerald-950/40">
            
            {/* Header Brand */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
              <div className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-md">
                  <Image
                    src="https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png"
                    alt="Ephorsys Pvt Ltd Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Ephorsys Pvt Ltd</h2>
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    Admin Security Portal
                  </p>
                </div>
              </div>

              {/* Step indicator badge */}
              {step !== 'success' && (
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                  {step === 'email' && 'Step 1 of 3'}
                  {step === 'otp' && 'Step 2 of 3'}
                  {step === 'password' && 'Step 3 of 3'}
                </div>
              )}
            </div>

            {/* Notifications */}
            {error && (
              <div className="mb-6 bg-red-500/15 border border-red-500/40 backdrop-blur-sm text-red-200 px-4 py-3.5 rounded-2xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{error}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="text-xs text-red-300/80 mt-1">
                      {remainingAttempts} attempt(s) remaining before security lockout.
                    </p>
                  )}
                </div>
              </div>
            )}

            {infoMessage && !error && (
              <div className="mb-6 bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-sm text-emerald-200 px-4 py-3.5 rounded-2xl text-sm flex items-center gap-3 animate-in fade-in">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <p>{infoMessage}</p>
              </div>
            )}

            {/* ================= STEP 1: ENTER EMAIL ================= */}
            {step === 'email' && (
              <div>
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Forgot Password?
                  </h1>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Enter the email registered with your administrator account. We will send you a secure 6-digit one-time verification code.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-200">
                      Admin Email Address
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="admin@ephorsys.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                        className="h-14 bg-slate-900/90 border border-slate-700 backdrop-blur-sm text-white placeholder-slate-500 rounded-2xl text-base focus:border-emerald-500 focus:ring-emerald-500/20 transition-all pl-12"
                      />
                      <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-600/40 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending verification code...
                      </>
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Return to Sign In
                    </Link>
                  </div>
                </form>
              </div>
            )}

            {/* ================= STEP 2: VERIFY OTP ================= */}
            {step === 'otp' && (
              <div>
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Enter Verification Code
                  </h1>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We sent a 6-digit one-time code to{' '}
                    <span className="font-semibold text-white">{maskEmail(email)}</span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex flex-col items-center justify-center space-y-4 py-2">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      disabled={loading || otpTimeLeft === 0}
                    >
                      <InputOTPGroup className="gap-2 sm:gap-3">
                        <InputOTPSlot
                          index={0}
                          className="w-11 h-14 sm:w-13 sm:h-16 text-xl sm:text-2xl font-bold text-white bg-slate-900 border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <InputOTPSlot
                          index={1}
                          className="w-11 h-14 sm:w-13 sm:h-16 text-xl sm:text-2xl font-bold text-white bg-slate-900 border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <InputOTPSlot
                          index={2}
                          className="w-11 h-14 sm:w-13 sm:h-16 text-xl sm:text-2xl font-bold text-white bg-slate-900 border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <InputOTPSeparator className="text-slate-600" />
                        <InputOTPSlot
                          index={3}
                          className="w-11 h-14 sm:w-13 sm:h-16 text-xl sm:text-2xl font-bold text-white bg-slate-900 border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <InputOTPSlot
                          index={4}
                          className="w-11 h-14 sm:w-13 sm:h-16 text-xl sm:text-2xl font-bold text-white bg-slate-900 border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <InputOTPSlot
                          index={5}
                          className="w-11 h-14 sm:w-13 sm:h-16 text-xl sm:text-2xl font-bold text-white bg-slate-900 border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </InputOTPGroup>
                    </InputOTP>

                    {/* Expiration Timer Indicator */}
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      <span>Code expires in:</span>
                      <span className={`font-mono px-2 py-0.5 rounded ${otpTimeLeft < 120 ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-emerald-400'}`}>
                        {formatTimer(otpTimeLeft)}
                      </span>
                    </div>
                  </div>

                  {/* Verify Button */}
                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6 || otpTimeLeft === 0}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying code...
                      </>
                    ) : (
                      <>
                        Verify Code
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>

                  {/* Resend & Back actions */}
                  <div className="flex items-center justify-between pt-2 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setOtp('');
                        setError('');
                        setInfoMessage('');
                      }}
                      className="text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Change Email
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading || cooldown > 0}
                      className="text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 transition-colors font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================= STEP 3: NEW PASSWORD ================= */}
            {step === 'password' && (
              <div>
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Create New Password
                  </h1>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Set a strong, unique password for your Ephorsys administrator account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-200">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                        required
                        className="h-14 bg-slate-900/90 border border-slate-700 backdrop-blur-sm text-white placeholder-slate-500 rounded-2xl text-base focus:border-emerald-500 focus:ring-emerald-500/20 transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 focus:outline-none transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-200">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                        className="h-14 bg-slate-900/90 border border-slate-700 backdrop-blur-sm text-white placeholder-slate-500 rounded-2xl text-base focus:border-emerald-500 focus:ring-emerald-500/20 transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 focus:outline-none transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Real-time Security Criteria Checklist */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <p className="font-semibold text-slate-300 text-xs uppercase tracking-wider mb-2">
                      Password Requirements:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className={`flex items-center gap-2 ${passwordCriteria.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.length ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        At least 8 characters
                      </div>
                      <div className={`flex items-center gap-2 ${passwordCriteria.upperAndLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.upperAndLower ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        Uppercase & lowercase
                      </div>
                      <div className={`flex items-center gap-2 ${passwordCriteria.number ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.number ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        At least one number
                      </div>
                      <div className={`flex items-center gap-2 ${passwordCriteria.special ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.special ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        Special symbol (!@#$%^&*)
                      </div>
                    </div>
                    {confirmPassword && (
                      <div className={`flex items-center gap-2 pt-1 border-t border-slate-800/80 ${passwordCriteria.match ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.match ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {passwordCriteria.match ? 'Passwords match' : 'Passwords do not match'}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !isPasswordValid}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating password...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* ================= STEP 4: SUCCESS ================= */}
            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-3">
                  Password Reset Complete
                </h1>

                <p className="text-slate-300 text-base max-w-md mx-auto mb-8 leading-relaxed">
                  Your administrator account password has been updated securely. You can now use your new password to access the portal.
                </p>

                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 cursor-pointer"
                >
                  Proceed to Sign In
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-5 text-center text-xs text-slate-500 bg-black/60">
        &copy; 2026 Ephorsys Pvt Ltd. All rights reserved. End-to-end encrypted admin verification.
      </div>
    </div>
  );
}
