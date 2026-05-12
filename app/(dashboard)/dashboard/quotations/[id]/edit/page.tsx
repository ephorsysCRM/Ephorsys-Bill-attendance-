'use client';

import { useEffect, useState, use } from 'react';
import QuotationForm from '@/components/forms/quotation-form';

export default function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await fetch(`/api/quotations/${id}`);
        if (response.ok) {
          const data = await response.json();
          setQuotation(data);
        }
      } catch (error) {
        console.error('Failed to fetch quotation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading quotation...</div>;
  if (!quotation) return <div className="p-8 text-center text-muted-foreground">Quotation not found.</div>;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Edit Quotation</h1>
        <p className="text-muted-foreground">Modify the quotation details and save changes.</p>
      </div>

      <QuotationForm initialData={quotation} isEditing={true} />
    </div>
  );
}
