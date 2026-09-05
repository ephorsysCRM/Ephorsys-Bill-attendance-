'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  Loader2,
  FileText,
  Users,
  CalendarCheck,
  Settings,
  PlusCircle,
  BarChart3,
  CornerDownLeft,
  Sparkles,
  ArrowRight,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
}

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

interface QuickItem {
  id: string;
  type: 'page' | 'action';
  title: string;
  subtitle: string;
  href: string;
  icon: any;
  keywords: string[];
}

interface SearchInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  status: string;
  date: string;
}

interface SearchQuotation {
  id: string;
  quotationNumber: string;
  clientName: string;
  total: number;
  status: string;
  date: string;
}

interface SearchClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
}

interface SearchEmployee {
  id: string;
  name: string;
  empId: string;
  designation: string;
  empType: string;
}

interface SearchResults {
  invoices: SearchInvoice[];
  quotations: SearchQuotation[];
  clients: SearchClient[];
  employees: SearchEmployee[];
}

const STATIC_ITEMS: QuickItem[] = [
  {
    id: 'page-dashboard',
    type: 'page',
    title: 'Dashboard',
    subtitle: 'Overview, analytics & financial summary',
    href: '/dashboard',
    icon: BarChart3,
    keywords: ['dashboard', 'home', 'main', 'analytics', 'stats', 'overview'],
  },
  {
    id: 'page-invoices',
    type: 'page',
    title: 'Invoices',
    subtitle: 'View and manage all client invoices',
    href: '/dashboard/invoices',
    icon: FileText,
    keywords: ['invoices', 'bills', 'payments', 'billing', 'all invoices'],
  },
  {
    id: 'action-new-invoice',
    type: 'action',
    title: 'Create New Invoice',
    subtitle: 'Generate and send a new bill to a client',
    href: '/dashboard/invoices/new',
    icon: PlusCircle,
    keywords: ['new invoice', 'create invoice', 'add bill', 'new bill', 'generate invoice'],
  },
  {
    id: 'page-quotations',
    type: 'page',
    title: 'Quotations',
    subtitle: 'Proposals, cost estimates & price quotes',
    href: '/dashboard/quotations',
    icon: Receipt,
    keywords: ['quotations', 'quotes', 'estimates', 'proposals', 'pricing'],
  },
  {
    id: 'action-new-quotation',
    type: 'action',
    title: 'Create New Quotation',
    subtitle: 'Generate and share a price quotation',
    href: '/dashboard/quotations/new',
    icon: PlusCircle,
    keywords: ['new quotation', 'create quotation', 'new quote', 'estimate'],
  },
  {
    id: 'page-clients',
    type: 'page',
    title: 'Clients Directory',
    subtitle: 'Manage client companies, contacts & accounts',
    href: '/dashboard/clients',
    icon: Users,
    keywords: ['clients', 'customers', 'contacts', 'parties', 'directory'],
  },
  {
    id: 'page-attendance',
    type: 'page',
    title: 'Staff & Attendance',
    subtitle: 'Track daily presence, employees & leave logs',
    href: '/dashboard/attendance',
    icon: CalendarCheck,
    keywords: ['attendance', 'staff', 'employees', 'leaves', 'calendar', 'work'],
  },
  {
    id: 'page-settings',
    type: 'page',
    title: 'Settings & Profile',
    subtitle: 'Configure company profile, taxes & preferences',
    href: '/dashboard/settings',
    icon: Settings,
    keywords: ['settings', 'taxes', 'currency', 'profile', 'configuration'],
  },
];

export default function Header({
  onMenuClick,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Search state
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResults>({
    invoices: [],
    quotations: [],
    clients: [],
    employees: [],
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        if (window.innerWidth < 768) {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        } else {
          desktopInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced API Search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({
        invoices: [],
        quotations: [],
        clients: [],
        employees: [],
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search fetch error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Filter static quick items based on query
  const filteredQuickItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return STATIC_ITEMS; // Show all quick links when query is empty
    }
    return STATIC_ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(trimmed) ||
        item.subtitle.toLowerCase().includes(trimmed) ||
        item.keywords.some((kw) => kw.includes(trimmed))
      );
    });
  }, [query]);

  // Compute a flat list of all currently visible items for keyboard navigation
  type FlatItem =
    | { type: 'quick'; item: QuickItem; href: string }
    | { type: 'invoice'; item: SearchInvoice; href: string }
    | { type: 'quotation'; item: SearchQuotation; href: string }
    | { type: 'client'; item: SearchClient; href: string }
    | { type: 'employee'; item: SearchEmployee; href: string };

  const flatItems = useMemo<FlatItem[]>(() => {
    const list: FlatItem[] = [];

    // Quick navigation / actions
    filteredQuickItems.forEach((item) => {
      list.push({ type: 'quick', item, href: item.href });
    });

    // Invoices
    results.invoices.forEach((item) => {
      list.push({
        type: 'invoice',
        item,
        href: `/dashboard/invoices/${item.id}/edit`,
      });
    });

    // Quotations
    results.quotations.forEach((item) => {
      list.push({
        type: 'quotation',
        item,
        href: `/dashboard/quotations/${item.id}/edit`,
      });
    });

    // Clients
    results.clients.forEach((item) => {
      list.push({
        type: 'client',
        item,
        href: `/dashboard/clients`,
      });
    });

    // Employees
    results.employees.forEach((item) => {
      list.push({
        type: 'employee',
        item,
        href: `/dashboard/attendance`,
      });
    });

    return list;
  }, [filteredQuickItems, results]);

  // Reset or constrain selectedIndex whenever flatItems changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems.length, query]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  const handleNavigate = useCallback(
    (href: string) => {
      setIsOpen(false);
      setIsMobileSearchOpen(false);
      setQuery('');
      router.push(href);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setSelectedIndex((prev) =>
          flatItems.length > 0 ? (prev + 1) % flatItems.length : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setSelectedIndex((prev) =>
          flatItems.length > 0
            ? (prev - 1 + flatItems.length) % flatItems.length
            : 0
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && flatItems[selectedIndex]) {
        handleNavigate(flatItems[selectedIndex].href);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setIsMobileSearchOpen(false);
      desktopInputRef.current?.blur();
      mobileInputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ invoices: [], quotations: [], clients: [], employees: [] });
    desktopInputRef.current?.focus();
    mobileInputRef.current?.focus();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'accepted':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'sent':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'draft':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'overdue':
      case 'declined':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';

  const hasAnyResults =
    filteredQuickItems.length > 0 ||
    results.invoices.length > 0 ||
    results.quotations.length > 0 ||
    results.clients.length > 0 ||
    results.employees.length > 0;

  // Track global index count as we render sections
  let runningIndex = 0;

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 md:px-6 lg:px-8">
        {/* LEFT SECTION: Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Open sidebar navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* CENTER SECTION: Desktop Search Input & Dropdown */}
        <div
          ref={searchContainerRef}
          className="hidden md:flex flex-1 justify-center px-6 relative max-w-2xl"
        >
          <div className="relative w-full max-w-lg">
            <Search
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none transition-colors"
            />

            <Input
              ref={desktopInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search invoices, clients, quotations, pages..."
              className="
                h-10
                w-full
                rounded-xl
                border-white/10
                bg-white/[0.05]
                pl-10
                pr-20
                text-sm
                text-white
                placeholder:text-zinc-500
                outline-none
                transition-all
                focus:border-white/25
                focus:bg-white/[0.08]
                focus:ring-2
                focus:ring-violet-500/20
              "
            />

            <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              ) : query ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-md p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}

              <kbd className="pointer-events-none select-none items-center gap-0.5 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-400 hidden sm:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>

            {/* DESKTOP SEARCH RESULTS DROPDOWN */}
            {isOpen && (
              <div
                ref={resultsContainerRef}
                className="
                  absolute left-0 right-0 top-full mt-2
                  max-h-[480px] overflow-y-auto
                  rounded-2xl border border-white/10
                  bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-2xl
                  z-50 animate-in fade-in-50 zoom-in-95 duration-150
                "
              >
                {!hasAnyResults && !isLoading ? (
                  <div className="py-10 text-center text-sm text-zinc-400">
                    <p className="font-medium text-zinc-300">No results found</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      No invoices, clients, or pages matched &quot;{query}&quot;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 p-1">
                    {/* 1. Quick Pages & Actions */}
                    {filteredQuickItems.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          <Sparkles className="h-3 w-3 text-violet-400" />
                          <span>{query ? 'Pages & Actions' : 'Quick Suggestions'}</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {filteredQuickItems.map((item) => {
                            const currentIndex = runningIndex++;
                            const isSelected = selectedIndex === currentIndex;
                            const Icon = item.icon;

                            return (
                              <button
                                key={item.id}
                                data-index={currentIndex}
                                onClick={() => handleNavigate(item.href)}
                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                className={`
                                  flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-all
                                  ${
                                    isSelected
                                      ? 'bg-white/10 text-white ring-1 ring-white/10'
                                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`
                                      flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border
                                      ${
                                        item.type === 'action'
                                          ? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                                          : 'border-white/10 bg-white/5 text-zinc-300'
                                      }
                                    `}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-sm font-medium leading-none truncate">
                                      {item.title}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500 truncate">
                                      {item.subtitle}
                                    </p>
                                  </div>
                                </div>
                                <ArrowRight
                                  className={`h-4 w-4 shrink-0 transition-transform ${
                                    isSelected
                                      ? 'text-white translate-x-0.5'
                                      : 'text-zinc-600'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. Invoices */}
                    {results.invoices.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          <FileText className="h-3 w-3 text-sky-400" />
                          <span>Invoices ({results.invoices.length})</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {results.invoices.map((inv) => {
                            const currentIndex = runningIndex++;
                            const isSelected = selectedIndex === currentIndex;

                            return (
                              <button
                                key={inv.id}
                                data-index={currentIndex}
                                onClick={() =>
                                  handleNavigate(`/dashboard/invoices/${inv.id}/edit`)
                                }
                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                className={`
                                  flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-all
                                  ${
                                    isSelected
                                      ? 'bg-white/10 text-white ring-1 ring-white/10'
                                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-400">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold text-white truncate">
                                        {inv.invoiceNumber}
                                      </p>
                                      <span
                                        className={`rounded-md border px-1.5 py-0.2 text-[10px] font-medium capitalize ${getStatusBadge(
                                          inv.status
                                        )}`}
                                      >
                                        {inv.status}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-zinc-400 truncate">
                                      {inv.clientName} • {new Date(inv.date).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-semibold text-emerald-400">
                                    ₹{inv.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. Quotations */}
                    {results.quotations.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          <Receipt className="h-3 w-3 text-amber-400" />
                          <span>Quotations ({results.quotations.length})</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {results.quotations.map((quotation) => {
                            const currentIndex = runningIndex++;
                            const isSelected = selectedIndex === currentIndex;

                            return (
                              <button
                                key={quotation.id}
                                data-index={currentIndex}
                                onClick={() =>
                                  handleNavigate(
                                    `/dashboard/quotations/${quotation.id}/edit`
                                  )
                                }
                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                className={`
                                  flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-all
                                  ${
                                    isSelected
                                      ? 'bg-white/10 text-white ring-1 ring-white/10'
                                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                    <Receipt className="h-4 w-4" />
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold text-white truncate">
                                        {quotation.quotationNumber}
                                      </p>
                                      <span
                                        className={`rounded-md border px-1.5 py-0.2 text-[10px] font-medium capitalize ${getStatusBadge(
                                          quotation.status
                                        )}`}
                                      >
                                        {quotation.status}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-zinc-400 truncate">
                                      {quotation.clientName} • {new Date(quotation.date).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-semibold text-amber-400">
                                    ₹{quotation.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. Clients */}
                    {results.clients.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          <Users className="h-3 w-3 text-emerald-400" />
                          <span>Clients ({results.clients.length})</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {results.clients.map((client) => {
                            const currentIndex = runningIndex++;
                            const isSelected = selectedIndex === currentIndex;

                            return (
                              <button
                                key={client.id}
                                data-index={currentIndex}
                                onClick={() => handleNavigate('/dashboard/clients')}
                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                className={`
                                  flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-all
                                  ${
                                    isSelected
                                      ? 'bg-white/10 text-white ring-1 ring-white/10'
                                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                    <Users className="h-4 w-4" />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-sm font-semibold text-white truncate">
                                      {client.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-zinc-400 truncate">
                                      {client.email || client.phone || client.city || 'No contact details'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs text-zinc-500 shrink-0">
                                  View Client
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 5. Employees */}
                    {results.employees.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          <UserCheck className="h-3 w-3 text-purple-400" />
                          <span>Employees ({results.employees.length})</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {results.employees.map((emp) => {
                            const currentIndex = runningIndex++;
                            const isSelected = selectedIndex === currentIndex;

                            return (
                              <button
                                key={emp.id}
                                data-index={currentIndex}
                                onClick={() => handleNavigate('/dashboard/attendance')}
                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                className={`
                                  flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-all
                                  ${
                                    isSelected
                                      ? 'bg-white/10 text-white ring-1 ring-white/10'
                                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
                                    <UserCheck className="h-4 w-4" />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-sm font-semibold text-white truncate">
                                      {emp.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-zinc-400 truncate">
                                      {emp.empId} • {emp.designation || 'Staff'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs text-zinc-500 shrink-0">
                                  Attendance
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Dropdown footer tip */}
                <div className="mt-2 border-t border-white/10 px-3 py-2 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Navigation: Use <kbd className="px-1 py-0.5 bg-white/5 rounded border border-white/10 text-zinc-400">↑</kbd> <kbd className="px-1 py-0.5 bg-white/5 rounded border border-white/10 text-zinc-400">↓</kbd> to select</span>
                  <span><kbd className="px-1 py-0.5 bg-white/5 rounded border border-white/10 text-zinc-400">Enter</kbd> to open</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION: Mobile Search Icon + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => {
              setIsMobileSearchOpen(true);
              setIsOpen(true);
              setTimeout(() => mobileInputRef.current?.focus(), 50);
            }}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg text-zinc-400
              transition-all hover:bg-white/10
              hover:text-white md:hidden
            "
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Divider */}
          <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />

          {/* User Profile */}
          <div className="flex items-center gap-3">
            {/* User Details */}
            <div className="hidden text-right sm:block">
              <p className="max-w-[150px] truncate text-sm font-medium text-white">
                {user?.name || 'User'}
              </p>
              <p className="max-w-[150px] truncate text-xs text-zinc-500">
                {user?.company || user?.email || 'Account'}
              </p>
            </div>

            {/* Avatar */}
            <button
              className="
                group relative flex h-10 w-10
                items-center justify-center
                overflow-hidden rounded-full
                bg-gradient-to-br
                from-violet-500
                via-purple-500
                to-indigo-600
                text-sm font-bold text-white
                shadow-lg shadow-purple-500/20
                ring-1 ring-white/10
                transition-all
                hover:ring-white/30
              "
              aria-label="User profile"
            >
              {userInitial}
              <span
                className="
                  absolute bottom-0.5 right-0.5
                  h-2.5 w-2.5 rounded-full
                  border-2 border-black
                  bg-emerald-500
                "
              />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE SEARCH OVERLAY / MODAL */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl p-4 md:hidden animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <Input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search invoices, clients..."
                className="
                  h-11 w-full rounded-xl border-white/10 bg-white/5
                  pl-10 pr-10 text-sm text-white placeholder:text-zinc-500
                  focus:border-white/20 focus:ring-1 focus:ring-white/10
                "
              />
              {isLoading ? (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
              ) : query ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setIsOpen(false);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Results Scroll Area */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pb-12">
            {!hasAnyResults && !isLoading ? (
              <div className="py-12 text-center text-sm text-zinc-400">
                <p className="font-medium text-zinc-300">No results found</p>
                <p className="mt-1 text-xs text-zinc-500">
                  No invoices, clients, or pages matched &quot;{query}&quot;
                </p>
              </div>
            ) : (
              <>
                {/* Quick Pages */}
                {filteredQuickItems.length > 0 && (
                  <div>
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      {query ? 'Pages & Actions' : 'Quick Suggestions'}
                    </p>
                    <div className="space-y-1">
                      {filteredQuickItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigate(item.href)}
                            className="flex w-full items-center justify-between rounded-xl bg-white/[0.03] p-3 text-left border border-white/5 active:bg-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-300">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {item.title}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-600" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Invoices */}
                {results.invoices.length > 0 && (
                  <div>
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      Invoices
                    </p>
                    <div className="space-y-1">
                      {results.invoices.map((inv) => (
                        <button
                          key={inv.id}
                          onClick={() =>
                            handleNavigate(`/dashboard/invoices/${inv.id}/edit`)
                          }
                          className="flex w-full items-center justify-between rounded-xl bg-white/[0.03] p-3 text-left border border-white/5 active:bg-white/10"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">
                                {inv.invoiceNumber}
                              </p>
                              <span
                                className={`rounded-md border px-1.5 py-0.2 text-[10px] font-medium capitalize ${getStatusBadge(
                                  inv.status
                                )}`}
                              >
                                {inv.status}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {inv.clientName}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-emerald-400">
                            ₹{inv.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quotations */}
                {results.quotations.length > 0 && (
                  <div>
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      Quotations
                    </p>
                    <div className="space-y-1">
                      {results.quotations.map((q) => (
                        <button
                          key={q.id}
                          onClick={() =>
                            handleNavigate(`/dashboard/quotations/${q.id}/edit`)
                          }
                          className="flex w-full items-center justify-between rounded-xl bg-white/[0.03] p-3 text-left border border-white/5 active:bg-white/10"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">
                                {q.quotationNumber}
                              </p>
                              <span
                                className={`rounded-md border px-1.5 py-0.2 text-[10px] font-medium capitalize ${getStatusBadge(
                                  q.status
                                )}`}
                              >
                                {q.status}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {q.clientName}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-amber-400">
                            ₹{q.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clients */}
                {results.clients.length > 0 && (
                  <div>
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      Clients
                    </p>
                    <div className="space-y-1">
                      {results.clients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleNavigate('/dashboard/clients')}
                          className="flex w-full items-center justify-between rounded-xl bg-white/[0.03] p-3 text-left border border-white/5 active:bg-white/10"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {c.name}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {c.email || c.phone || 'Client'}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-zinc-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Employees */}
                {results.employees.length > 0 && (
                  <div>
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      Employees
                    </p>
                    <div className="space-y-1">
                      {results.employees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => handleNavigate('/dashboard/attendance')}
                          className="flex w-full items-center justify-between rounded-xl bg-white/[0.03] p-3 text-left border border-white/5 active:bg-white/10"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {emp.name}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {emp.empId} • {emp.designation || 'Staff'}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-zinc-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
