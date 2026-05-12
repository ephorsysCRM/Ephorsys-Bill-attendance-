'use client';

import { useEffect, useState, use } from 'react';
import InvoiceForm from '@/components/forms/invoice-form';

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${id}`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data);
        }
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading invoice...</div>;
  if (!invoice) return <div className="p-8 text-center text-muted-foreground">Invoice not found.</div>;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Edit Invoice</h1>
        <p className="text-muted-foreground">Modify the invoice details and save changes.</p>
      </div>

      <InvoiceForm initialData={invoice} isEditing={true} />
    </div>
  );
}
