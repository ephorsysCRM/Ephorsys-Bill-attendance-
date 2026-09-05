'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  X, 
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
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
    <div className={cn(
      "bg-black border-r border-sidebar-border h-screen flex flex-col transition-all duration-300 ease-in-out relative select-none",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo & Toggle Header */}
      <div className={cn(
        "border-b border-sidebar-border transition-all duration-300",
        isCollapsed ? "p-4 flex flex-col items-center gap-3" : "p-6"
      )}>
        <div className="flex items-center justify-between w-full">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
            <img 
              src="https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png" 
              alt="Ephorsys Logo" 
              className="w-8 h-8 shrink-0" 
            />
            {!isCollapsed && (
              <h1 className="text-2xl font-bold gradient-text whitespace-nowrap overflow-hidden transition-all duration-200">
                Ephorsys
              </h1>
            )}
          </div>

          {/* Desktop collapse toggle button */}
          {onToggleCollapse && !isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-sidebar-foreground hover:text-sidebar-accent transition-colors"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Collapsed state toggle button */}
        {isCollapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {!isCollapsed && (
          <p className="text-xs text-sidebar-foreground/60 mt-1 whitespace-nowrap">Billing Software</p>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg transition-all duration-200 group relative",
                isCollapsed 
                  ? "justify-center p-3" 
                  : "gap-3 px-4 py-3",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap transition-opacity duration-200">
                  {item.label}
                </span>
              )}
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border transition-opacity">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex cursor-pointer items-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-destructive transition-all duration-200 group relative",
            isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium whitespace-nowrap">Logout</span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border transition-opacity">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
