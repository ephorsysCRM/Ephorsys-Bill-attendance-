'use client';

import InvoiceForm from '@/components/forms/invoice-form';

export default function NewInvoicePage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Create Invoice</h1>
        <p className="text-muted-foreground">Create a new invoice and send it to your clients.</p>
      </div>

      <InvoiceForm />
    </div>
  );
}
