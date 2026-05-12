"use client";
import React from "react";

// Inline Button Component (Improved with your green brand color)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "gradient";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = "default", size = "default", className = "", children, asChild = false, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-white text-black hover:bg-gray-100 active:bg-gray-200",
      secondary: "bg-gray-800 text-white hover:bg-gray-700",
      ghost: "hover:bg-white/10 text-white border border-white/20",
      gradient: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.985]",
    };

    const sizes = {
      default: "h-11 px-6 text-sm",
      sm: "h-10 px-5 text-sm",
      lg: "h-14 px-8 text-base",
    };

    const mergedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim();


    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={mergedClasses}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Icons
const ArrowRight = ({ className = "", size = 18 }: { className?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const Menu = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const X = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

// Navigation
const Navigation = React.memo(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/90 backdrop-blur-lg">
      <nav className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png"
              alt="Ephorsys Pvt Ltd"
              className="h-9 w-auto"
            />
            <div>
              <div className="text-xl font-semibold text-white tracking-tight">Ephorsys</div>
              <div className="text-[10px] text-emerald-400 -mt-1">Pvt Ltd</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-white/70 hover:text-white transition-colors">Testimonials</a>
            <a href="#contact" className="text-sm text-white/70 hover:text-white transition-colors">Contact</a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="/login">Sign in</a>
            </Button>
           
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-lg border-t border-white/10">
          <div className="px-6 py-6 flex flex-col gap-5 text-lg">
            <a href="#features" className="text-white/80 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-white/80 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" className="text-white/80 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
            <a href="#contact" className="text-white/80 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Contact</a>

            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              <Button variant="ghost" size="lg" className="w-full" asChild>
                <a href="/login">Sign in</a>
              </Button>
              {/* <Button variant="gradient" size="lg" className="w-full" asChild>
                <a href="/signup">Get Started Free</a>
              </Button> */}
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

Navigation.displayName = "Navigation";

// Hero Section
const Hero = React.memo(() => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 px-6 overflow-hidden bg-black">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(at_center,#22c55e10_0%,transparent_70%)]" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/50 mb-6">
          <span className="text-xs font-medium text-emerald-400">✦ Now Live</span>
          <span className="text-xs text-white/70">GST-ready invoicing for Indian businesses</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight tracking-tighter text-white mb-6">
          Smart Billing for<br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Modern Businesses
          </span>
        </h1>

        <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
          Create professional invoices, quotations, and GST-compliant bills in seconds.<br />
          Built for Indian startups and growing businesses.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button variant="gradient" size="lg" className="text-lg px-10" asChild>
            <a href="/login">
             Get Started
            </a>
          </Button>

          <Button variant="ghost" size="lg" className="text-lg px-8 border border-white/30" asChild>
            <a href="#demo">Watch Demo</a>
          </Button>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-8 text-sm text-white/60">
          <div>✓ GST Compliant</div>
          <div>✓ Secure Payments</div>
          <div>✓ 500+ Businesses</div>
        </div>
      </div>

      {/* Dashboard Preview */}
      <div className="mt-20 w-full max-w-6xl mx-auto px-4 relative z-10">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-emerald-500/10">
          <img
            src="https://i.postimg.cc/SKcdVTr1/Dashboard2.png" 
            alt="Ephorsys Billing Dashboard"
            className="w-full h-auto"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

// Main Landing Page
export default function EphorsysLanding() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden mt-4">
      <Navigation />
      <Hero />

      {/* You can add more sections later like Features, Pricing, etc. */}
    </main>
  );
}