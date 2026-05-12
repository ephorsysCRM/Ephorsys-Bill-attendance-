'use client';

import { FormEvent, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: any) => void;
}

const defaultClientData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  taxNumber: '',
};

export default function ClientModal({ open, onOpenChange, onClientCreated }: ClientModalProps) {
  const [clientData, setClientData] = useState(defaultClientData);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof typeof defaultClientData, value: string) => {
    setClientData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        const client = await response.json();
        onClientCreated(client);
        setClientData(defaultClientData);
        onOpenChange(false);
      } else {
        const data = await response.json();
        console.error('Failed to create client:', data.error);
        alert(`Failed to create client: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Create client error:', error);
      alert('An error occurred while creating the client. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-black/90 backdrop-blur-lg border border-border rounded-lg p-6">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Fill in the client information and save to use it in the quotation or invoice.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 bg-black p-6 rounded-lg">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Client Name</label>
              <Input
                value={clientData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Client name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={clientData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="client@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <Input
                value={clientData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">GST Number</label>
              <Input
                value={clientData.taxNumber}
                onChange={(e) => handleChange('taxNumber', e.target.value)}
                placeholder="GST number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <Input
              value={clientData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Street, locality"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <Input
                value={clientData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <Input
                value={clientData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Country"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Client'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
