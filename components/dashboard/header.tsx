'use client';

import { useEffect, useState } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <header className="h-16 border-b border-border bg-black backdrop-blur-sm px-4 md:px-8 flex items-center justify-between">
      {/* Logo and Search */}
      <div className="flex items-center gap-4 flex-1">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {/* <div className="flex items-center gap-3">
          <img src="https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png" alt="Ephorsys Logo" className="w-6 h-6 md:w-8 md:h-8" />
          <h1 className="text-xl md:text-2xl font-bold gradient-text hidden sm:block">Ephorsys</h1>
        </div> */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 bg-secondary/50 border-border focus:bg-secondary"
            />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-8">
        {/* Notifications */}
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.company || user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
