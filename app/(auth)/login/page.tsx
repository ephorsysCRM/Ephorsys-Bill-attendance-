'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/dashboard');
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
              <div className="mb-10">
                {/* Updated Logo & Company Name */}
                <div className="inline-flex items-center gap-3 mb-8">
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
                    <p className="text-emerald-400 text-sm font-medium">Billing Platform</p>
                  </div>
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                  Welcome Back
                </h1>
                <p className="text-slate-300 text-lg">
                  Sign in to manage your invoices and quotations.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-sm text-red-200 px-5 py-4 rounded-xl text-sm flex gap-3">
                    <div className="w-1 bg-red-500 rounded-full mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
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
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="h-14 bg-slate-900/70 border border-slate-700/70 backdrop-blur-sm text-white placeholder-slate-400 rounded-2xl text-base focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                {/* Sign in button - Updated with green theme */}
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
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Right column - Feature showcase */}
            <div className="hidden md:flex flex-col order-1 md:order-2">
              <div className="space-y-8">
                {[
                  {
                    icon: '📋',
                    title: 'Manage Invoices',
                    desc: 'Create, send, and track invoices with ease',
                  },
                  {
                    icon: '📊',
                    title: 'Professional Reports',
                    desc: 'Generate detailed financial reports instantly',
                  },
                  {
                    icon: '🔒',
                    title: 'Secure & Reliable',
                    desc: 'Bank-level security for your business data',
                  },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="group p-6 rounded-3xl bg-slate-900/40 border border-slate-700/50 backdrop-blur-md hover:bg-slate-800/60 hover:border-emerald-500/40 transition-all duration-300"
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-base leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Trust badge with green accent */}
              <div className="mt-12 p-6 rounded-3xl bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 backdrop-blur-md">
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-emerald-400">Trusted by 500+</span> businesses worldwide
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative bottom-0 left-0 right-0 z-20 border-t border-slate-700/30 px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-500 bg-black/50">
        © 2026 Ephorsys Pvt Ltd. All rights reserved.
      </div>
    </div>
  );
}