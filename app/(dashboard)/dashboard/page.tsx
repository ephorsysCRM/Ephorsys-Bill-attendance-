'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, TrendingUp, FileText, Users } from 'lucide-react';

interface Stats {
  totalInvoices: number;
  totalQuotations: number;
  totalClients: number;
  totalRevenue: number;
}

const chartData = [
  { month: 'Jan', revenue: 4000, invoices: 24 },
  { month: 'Feb', revenue: 3000, invoices: 21 },
  { month: 'Mar', revenue: 2000, invoices: 29 },
  { month: 'Apr', revenue: 2780, invoices: 40 },
  { month: 'May', revenue: 1890, invoices: 36 },
  { month: 'Jun', revenue: 2390, invoices: 20 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalInvoices: 0,
    totalQuotations: 0,
    totalClients: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      color: 'from-primary to-primary/60',
      href: '/dashboard/invoices',
    },
    {
      label: 'Total Quotations',
      value: stats.totalQuotations,
      icon: FileText,
      color: 'from-accent to-accent/60',
      href: '/dashboard/quotations',
    },
    {
      label: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'from-chart-3 to-chart-3/60',
      href: '/dashboard/clients',
    },
    {
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-chart-4 to-chart-4/60',
      href: '/dashboard/invoices',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your billing overview.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/invoices/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground cursor-pointer rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
          <Link
            href="/dashboard/quotations/new"
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="glass-card h-full cursor-pointer hover:border-primary/50 transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">{card.label}</p>
                    <p className="text-3xl font-bold text-foreground">{loading ? '...' : card.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(91, 141, 217, 0.1)" />
              <XAxis stroke="#9eb3d4" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9eb3d4" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 82, 0.8)',
                  border: '1px solid rgba(91, 141, 217, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e0e6ff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#5b8dd9" dot={{ fill: '#5b8dd9' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Invoices Chart */}
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Invoices Created</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(91, 141, 217, 0.1)" />
              <XAxis stroke="#9eb3d4" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9eb3d4" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 82, 0.8)',
                  border: '1px solid rgba(91, 141, 217, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e0e6ff' }}
              />
              <Bar dataKey="invoices" fill="#00d9ff" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
