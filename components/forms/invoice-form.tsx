'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ClientModal from '@/components/forms/client-modal';
import { Trash2, Plus } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  sacCode?: string;
}

interface InvoiceFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function InvoiceForm({ initialData, isEditing = false }: InvoiceFormProps) {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || '');

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
  const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, sacCode: '' }]);
  const [status, setStatus] = useState(initialData?.status || 'draft');
  
  const [deposits, setDeposits] = useState<any[]>(() => {
    if (initialData?.deposits && initialData.deposits.length > 0) {
      return initialData.deposits.map((d: any) => ({
        amount: d.amount,
        date: new Date(d.date).toISOString().split('T')[0],
        notes: d.notes || ''
      }));
    } else if (initialData?.paidAmount > 0) {
      return [{
        amount: initialData.paidAmount,
        date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        notes: 'Initial Payment'
      }];
    }
    return [];
  });

  const addDeposit = () => {
    setDeposits([...deposits, { amount: 0, date: new Date().toISOString().split('T')[0], notes: '' }]);
  };

  const removeDeposit = (index: number) => {
    setDeposits(deposits.filter((_, i) => i !== index));
  };

  const handleDepositChange = (index: number, field: string, value: any) => {
    const newDeposits = [...deposits];
    newDeposits[index][field] = value;
    setDeposits(newDeposits);
  };

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

    const fetchNextInvoiceNumber = async () => {
      if (initialData?.invoiceNumber || isEditing) return;

      try {
        const response = await fetch('/api/invoices/next', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.nextInvoiceNumber) {
            setInvoiceNumber(data.nextInvoiceNumber);
          }
        }
      } catch (error) {
        console.error('Failed to fetch next invoice number:', error);
      }
    };

    fetchClients();
    fetchNextInvoiceNumber();
  }, [initialData, isEditing]);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTax = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const cgstAmount = tax / 2; // split tax into CGST and SGST
  const sgstAmount = tax / 2; // split tax into CGST and SGST
  const igstAmount = 0; // IGST not used
  const total = subtotal + tax;

  const paidAmount = deposits.reduce((sum, dep) => sum + (dep.amount || 0), 0);
  const balanceDue = total - paidAmount;

  useEffect(() => {
    if (total > 0 && balanceDue <= 0 && status !== 'paid') {
      setStatus('paid');
    } else if (total > 0 && balanceDue > 0 && status === 'paid') {
      setStatus('sent');
    }
  }, [deposits, total, status, balanceDue]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, sacCode: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
    console.log(newItems[index]);
  };

  const handleClientCreated = (client: any) => {
    setClients((prev) => [...prev, client]);
    setClientId(client._id || client.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing ? `/api/invoices/${initialData._id}` : '/api/invoices';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          invoiceNumber,
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
          paidAmount,
          deposits,
        }),
      });

      if (response.ok) {
        router.push('/dashboard/invoices');
      } else {
        const data = await response.json();
        alert(`Error saving invoice: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save invoice:', error);
      alert('Failed to save invoice. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Invoice Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Invoice Number</label>
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-001"
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
                  className="inline-flex items-center gap-2 hover:text-white cursor-pointer whitespace-nowrap"
                  onClick={() => setClientModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Client
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Choose a saved client, or add a new client before generating the invoice.</p>
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
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Invoice Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
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
                <th className="px-4 py-2 text-left text-sm font-medium min-w-[200px]">SAC</th>
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
                    <select
                      value={(item as any).sacCode || ''}
                      onChange={(e) => handleItemChange(index, 'sacCode', e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent text-foreground px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Code</option>
                      <option value="998361">998361 - Advertising Services</option>
                      <option value="998365">998365 - Online Ad Campaigns</option>
                      <option value="998313">998313 - IT Consulting Services</option>
                      <option value="998386">998386 - Social Media Marketing</option>
                    </select>
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
            
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-sm">Deposit History</h3>
                <Button type="button" variant="outline" size="sm" onClick={addDeposit} className="h-7 px-2 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {deposits.map((deposit, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center text-sm">
                  <Input 
                    type="date" 
                    value={deposit.date} 
                    onChange={(e) => handleDepositChange(index, 'date', e.target.value)}
                    className="w-[120px] bg-black border-input h-8 px-2 text-xs"
                  />
                  <Input 
                    type="number" 
                    value={deposit.amount || ''} 
                    onChange={(e) => handleDepositChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="Amount"
                    className="w-24 text-right bg-black border-input h-8 px-2 text-xs"
                    min="0"
                    step="0.01"
                  />
                  <Input 
                    value={deposit.notes} 
                    onChange={(e) => handleDepositChange(index, 'notes', e.target.value)}
                    placeholder="Notes (optional)"
                    className="flex-1 bg-black border-input h-8 px-2 text-xs"
                  />
                  <button type="button" onClick={() => removeDeposit(index)} className="text-destructive p-1 hover:bg-destructive/20 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <div className="flex justify-between items-center text-sm pt-4 mt-2 border-t border-border/50">
                <span className="text-muted-foreground">Total Paid:</span>
                <span className="font-medium text-green-500">₹{paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 text-destructive font-semibold">
                <span>Balance Due:</span>
                <span>₹{balanceDue.toFixed(2)}</span>
              </div>
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
          {loading ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
