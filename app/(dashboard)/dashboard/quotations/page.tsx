'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Edit2, Plus, Download } from 'lucide-react';
import { IQuotation } from '@/lib/models';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<(IQuotation & { clientName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const response = await fetch('/api/quotations');
        if (response.ok) {
          const data = await response.json();
          setQuotations(data.quotations);
        }
      } catch (error) {
        console.error('Failed to fetch quotations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
      const response = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setQuotations(quotations.filter((q) => q._id.toString() !== id));
      }
    } catch (error) {
      console.error('Failed to delete quotation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'sent':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'declined':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Quotations</h1>
          <p className="text-muted-foreground">Create and manage your quotations.</p>
        </div>
        <Link href="/dashboard/quotations/new">
          <Button className="flex items-center gap-2 cursor-pointer rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2">
            <Plus className="w-4 h-4" />
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Quotations Table */}
      <Card className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading quotations...</div>
        ) : quotations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No quotations yet. Create your first quotation to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Quotation #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Client</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation._id.toString()} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{quotation.quotationNumber}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{quotation.clientName || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(quotation.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">₹{quotation.total?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`/api/quotations/${quotation._id.toString()}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4 text-primary" />
                        </a>
                        <Link href={`/dashboard/quotations/${quotation._id.toString()}/edit`}>
                          <button className="p-2 hover:bg-accent/20 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4 text-accent" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(quotation._id.toString())}
                          className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
