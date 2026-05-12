'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ClientModal from '@/components/forms/client-modal';
import { Trash2, Plus } from 'lucide-react';

interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface QuotationFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function QuotationForm({ initialData, isEditing = false }: QuotationFormProps) {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [quotationNumber, setQuotationNumber] = useState(initialData?.quotationNumber || '');
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const companyInfo = {
    name: 'Ephorsys Private Limited',
    address: 'FIRST FLOOR, K-8/733, Kalinganagar, Bhubaneswar, Odisha, 751003',
    mobile: '6370238030',
    email: 'business@ephorsys.com',
    gstNumber: '21AAJCE2865M1ZF',
    accountName: 'Ephorsys Private Limited',
    bankName: 'AXIS BANK',
    accountNumber: '925020050969283',
    ifsc: 'UTIB0000381',
  };
  const [date, setDate] = useState(initialData?.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialData?.dueDate?.split('T')[0] || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [items, setItems] = useState<QuotationItem[]>(initialData?.items || [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const [status, setStatus] = useState(initialData?.status || 'draft');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      }
    };

    const fetchNextQuotationNumber = async () => {
      if (initialData?.quotationNumber || isEditing) return;

      try {
        const response = await fetch('/api/quotations/next');
        if (response.ok) {
          const data = await response.json();
          if (data.nextQuotationNumber) {
            setQuotationNumber(data.nextQuotationNumber);
          }
        }
      } catch (error) {
        console.error('Failed to fetch next quotation number:', error);
      }
    };

    fetchClients();
    fetchNextQuotationNumber();
  }, [initialData, isEditing]);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const cgstAmount = 0; // For inter-state transactions, CGST is 0
  const sgstAmount = 0; // For inter-state transactions, SGST is 0
  const igstAmount = tax; // IGST is the full tax amount
  const total = subtotal + tax;

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleClientCreated = (client: any) => {
    setClients((prev) => [...prev, client]);
    setClientId(client._id || client.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing ? `/api/quotations/${initialData._id}` : '/api/quotations';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          quotationNumber,
          date,
          dueDate,
          notes,
          items,
          status,
          subtotal,
          cgstAmount,
          sgstAmount,
          igstAmount,
          tax,
          total,
        }),
      });

      if (response.ok) {
        router.push('/dashboard/quotations');
      } else {
        const data = await response.json();
        alert(`Error saving quotation: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save quotation:', error);
      alert('Failed to save quotation. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quotation Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quotation Number</label>
            <Input
              value={quotationNumber}
              onChange={(e) => setQuotationNumber(e.target.value)}
              placeholder="QT-001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Client</label>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="flex-1 rounded-md border border-input bg-black cursor-pointer px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a client</option>
                  {clients.map((client: any) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex hover:text-white cursor-pointer items-center gap-2 whitespace-nowrap"
                  onClick={() => setClientModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Client
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Choose a saved client, or add a new client before generating the quotation.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-input bg-black cursor-pointer px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quotation Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Valid Until</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Company Details</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="font-semibold">{companyInfo.name}</p>
            <p>{companyInfo.address}</p>
            <p>Mobile: {companyInfo.mobile}</p>
            <p>Email: {companyInfo.email}</p>
            <p>GST Number: {companyInfo.gstNumber}</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Bank Details</p>
            <p>Account Name: {companyInfo.accountName}</p>
            <p>Bank Name: {companyInfo.bankName}</p>
            <p>Account Number: {companyInfo.accountNumber}</p>
            <p>IFSC: {companyInfo.ifsc}</p>
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                <th className="px-4 py-2 text-right text-sm font-medium">Quantity</th>
                <th className="px-4 py-2 text-right text-sm font-medium">Unit Price</th>
                <th className="px-4 py-2 text-right text-sm font-medium">Tax %</th>
                <th className="px-4 py-2 text-right text-sm font-medium">Amount</th>
                <th className="px-4 py-2 text-center text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-border/50">
                  <td className="px-4 py-2">
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                      min="1"
                      className="text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      className="text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={item.taxRate}
                      onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      className="text-right"
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium">
                    ₹{(item.quantity * item.unitPrice * (1 + item.taxRate / 100)).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 hover:bg-destructive/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" onClick={handleAddItem} variant="outline" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </Card>

      {/* Totals and Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or special instructions here..."
              className="w-full h-24 px-3 py-2 rounded-lg bg-black border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Card>
        </div>
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax:</span>
              <span className="font-medium">₹{tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="text-xl font-bold text-accent">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      <ClientModal
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        onClientCreated={handleClientCreated}
      />

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Quotation' : 'Create Quotation'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
