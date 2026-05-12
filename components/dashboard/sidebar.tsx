'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BarChart3, Users, Settings, LogOut, X, CalendarCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

const navItems = [
  {
    icon: BarChart3,
    label: 'Dashboard',
    href: '/dashboard',
    end: true,
  },
  {
    icon: FileText,
    label: 'Invoices',
    href: '/dashboard/invoices',
  },
  {
    icon: FileText,
    label: 'Quotations',
    href: '/dashboard/quotations',
  },
  {
    icon: Users,
    label: 'Clients',
    href: '/dashboard/clients',
  },
  {
    icon: CalendarCheck,
    label: 'Attendance',
    href: '/dashboard/attendance',
  },
  {
    icon: Settings,
    label: 'Settings',
    href: '/dashboard/settings',
  },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    });
    router.push('/login');
  };

  return (
    <div className="w-64 bg-black border-r border-sidebar-border h-screen flex flex-col ">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png" alt="Ephorsys Logo" className="w-8 h-8" />
            <h1 className="text-2xl font-bold gradient-text">Ephorsys</h1>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-sidebar-foreground hover:text-sidebar-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Billing Software</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="w-full flex cursor-pointer items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
