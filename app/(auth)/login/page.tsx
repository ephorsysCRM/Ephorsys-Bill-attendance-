'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Eye, EyeOff, Shield, UserCheck } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'admin' | 'hr'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTabChange = (type: 'admin' | 'hr') => {
    setLoginType(type);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      const destination = data.redirectUrl || (loginType === 'hr' ? '/dashboard/attendance' : '/dashboard');
      router.push(destination);
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png')] bg-cover bg-center bg-no-repeat" />
      
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Subtle green accent gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-black/80 to-slate-950/90" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Left column - Login form */}
            <div className="flex flex-col justify-center order-2 md:order-1">
              <div className="mb-6">
                {/* Logo & Company Name */}
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-lg">
                    <Image
                      src="https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png"
                      alt="Ephorsys Pvt Ltd Logo"
                      width={56}
                      height={56}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Ephorsys Pvt Ltd
                    </h2>
                    <p className="text-emerald-400 text-sm font-medium">
                      {loginType === 'admin' ? 'Billing & Administration' : 'HR Attendance Management'}
                    </p>
                  </div>
                </div>

                {/* Role Tabs */}
                <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 mb-6">
                  <button
                    type="button"
                    onClick={() => handleTabChange('admin')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      loginType === 'admin'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Admin Login
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('hr')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      loginType === 'hr'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    HR Portal
                  </button>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
                  {loginType === 'admin' ? 'Admin Sign In' : 'HR Portal Sign In'}
                </h1>
                <p className="text-slate-300 text-base">
                  {loginType === 'admin'
                    ? 'Sign in to manage invoices, quotations, and staff.'
                    : 'Sign in to record and manage daily staff attendance.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-sm text-red-200 px-5 py-4 rounded-xl text-sm flex gap-3 animate-in fade-in">
                    <div className="w-1 bg-red-500 rounded-full mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    {loginType === 'admin' ? 'Admin Email Address' : 'HR Email Address'}
                  </label>
                  <Input
                    type="email"
                    placeholder={loginType === 'admin' ? 'admin@company.com' : 'hr@company.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="h-14 bg-slate-900/70 border border-slate-700/70 backdrop-blur-sm text-white placeholder-slate-400 rounded-2xl text-base focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-200">
                      Password
                    </label>
                    {/* ONLY SHOW FORGOT PASSWORD FOR ADMIN */}
                    {loginType === 'admin' && (
                      <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="h-14 bg-slate-900/70 border border-slate-700/70 backdrop-blur-sm text-white placeholder-slate-400 rounded-2xl text-base focus:border-emerald-500 focus:ring-emerald-500/20 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 focus:outline-none transition-colors cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign in button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-600/50 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      {loginType === 'admin' ? 'Sign In as Admin' : 'Sign In as HR'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                {/* HR Information Note */}
                {loginType === 'hr' && (
                  <p className="text-center text-xs text-slate-400 mt-2 px-2">
                    🔒 HR login credentials are created and managed by the company administrator. Contact your administrator if you need password assistance.
                  </p>
                )}
              </form>
            </div>

            {/* Right column - Feature showcase */}
            <div className="hidden md:flex flex-col order-1 md:order-2">
              <div className="space-y-6">
                {[
                  {
                    icon: '📋',
                    title: 'Invoices & Quotations',
                    desc: 'Create, send, and track commercial documents with tax compliance',
                  },
                  {
                    icon: '⏱️',
                    title: 'Attendance Management',
                    desc: 'Track daily staff presence, leaves, WFH, and monthly performance',
                  },
                  {
                    icon: '🛡️',
                    title: 'Role-Based Access Control',
                    desc: 'Granular permissions restricting HR to the Attendance module',
                  },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="group p-5 rounded-3xl bg-slate-900/40 border border-slate-700/50 backdrop-blur-md hover:bg-slate-800/60 hover:border-emerald-500/40 transition-all duration-300"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Trust badge with green accent */}
              <div className="mt-8 p-5 rounded-3xl bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 backdrop-blur-md">
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-emerald-400">Ephorsys Enterprise</span> Billing & Workforce Portal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative bottom-0 left-0 right-0 z-20 border-t border-slate-700/30 px-4 sm:px-6 lg:px-8 py-5 text-center text-xs text-slate-500 bg-black/50">
        © 2026 Ephorsys Pvt Ltd. All rights reserved.
      </div>
    </div>
  );
}