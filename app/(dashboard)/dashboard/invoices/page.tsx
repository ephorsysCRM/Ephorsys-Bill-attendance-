'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Plus, Printer } from 'lucide-react';
import { IInvoice } from '@/lib/models';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<(IInvoice & { clientName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch('/api/invoices');
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setInvoices(invoices.filter((inv) => inv._id.toString() !== id));
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'sent':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'overdue':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  // 🔥 Filter + Sort (latest first)
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch =
          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          (inv.clientName || '').toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === 'all' || inv.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // latest first
  }, [invoices, search, statusFilter]);

  // 🔥 Pagination Logic
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices and track payments.</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="flex items-center gap-2 cursor-pointer rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg border w-full md:w-1/3"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border w-full md:w-1/4"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden bg-black/10">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : paginatedInvoices.length === 0 ? (
          <div className="p-8 text-center">No invoices found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-4 text-left">Invoice #</th>
                    <th className="px-6 py-4 text-left">Client</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Amount</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((invoice) => (
                    <tr key={invoice._id.toString()} className="border-b hover:bg-secondary/20">
                      <td className="px-6 py-4">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4">{invoice.clientName || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        ₹{invoice.total?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <a
                            href={`/invoices/${invoice._id}/print?print=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-green-500/20 text-muted-foreground hover:text-green-400 rounded transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </a>
                          <Link
                            href={`/dashboard/invoices/${invoice._id}/edit`}
                            className="p-1.5 hover:bg-secondary/20 text-muted-foreground hover:text-foreground rounded transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(invoice._id.toString())}
                            className="p-1.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🔥 Pagination UI */}
            <div className="flex justify-between items-center p-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex gap-2 rounded cursor-pointer">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  
                >
                  Prev
                </Button>

                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}