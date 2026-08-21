'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Plus, Mail } from 'lucide-react';
import { IClient } from '@/lib/models';

export default function ClientsPage() {
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    taxNumber: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newClient = await response.json();
        setClients([...clients, newClient]);
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          country: '',
          taxNumber: '',
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to add client:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setClients(clients.filter((c) => c._id.toString() !== id));
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-black/10 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Clients</h1>
          <p className="text-muted-foreground">Manage your client information.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <Card className="glass-card p-6">
          <form onSubmit={handleAddClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                // required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Tax Number"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary md:col-span-2"
              />
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit">Add Client</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Clients Table */}
      <Card className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No clients yet. Add your first client to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">City</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client._id.toString()} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{client.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <a href={`mailto:${client.email}`} className="hover:text-primary">
                        {client.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{client.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{client.city || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`mailto:${client.email}`} className="p-2 hover:bg-accent/20 rounded-lg transition-colors">
                          <Mail className="w-4 h-4 text-accent" />
                        </a>
                        <button
                          onClick={() => handleDelete(client._id as unknown as string)}
                          className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
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
