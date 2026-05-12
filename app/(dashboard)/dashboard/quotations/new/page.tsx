'use client';

import QuotationForm from '@/components/forms/quotation-form';

export default function NewQuotationPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Create Quotation</h1>
        <p className="text-muted-foreground">Create a new quotation and send it to your clients for approval.</p>
      </div>

      <QuotationForm />
    </div>
  );
}
