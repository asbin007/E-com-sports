import { useState, useEffect } from 'react';
import api from '@/services/api';
import type { DeliveryBoy } from '@/types';
import { Truck, Plus, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '@/utils/apiError';

export default function Delivery() {
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', phoneNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Callers that refetch after the initial mount set loading themselves.
  const load = async () => {
    try {
      const res = await api.get('/admin/delivery-boys');
      setDeliveryBoys(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load delivery boys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await load();
    };
    run();
  }, []);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email) {
      toast.error('Username and email are required');
      return;
    }
    setSubmitting(true);
    const password = form.password || generatePassword();
    try {
      await api.post('/admin/create-delivery', { ...form, password });
      setLastCreated({ email: form.email, password });
      setForm({ username: '', email: '', password: '', phoneNumber: '' });
      setShowForm(false);
      toast.success('Delivery boy account created');
      setLoading(true);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this delivery boy account?')) return;
    try {
      await api.delete(`/admin/delivery-boys/${id}`);
      setDeliveryBoys((prev) => prev.filter((d) => d.id !== id));
      toast.success('Deleted');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete'));
    }
  };

  const copyCredentials = () => {
    if (!lastCreated) return;
    navigator.clipboard.writeText(
      `Delivery Portal Login\nURL: ${window.location.origin.replace(':3001', ':5173')}/delivery/login\nEmail: ${lastCreated.email}\nPassword: ${lastCreated.password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-500" /> Delivery Team
          </h1>
          <p className="text-sm text-gray-500 mt-1">{deliveryBoys.length} delivery personnel</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Delivery Boy
        </button>
      </div>

      {/* Credentials banner */}
      {lastCreated && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-4">
          <p className="mb-2 text-sm font-bold text-green-700">Account created — share these credentials</p>
          <div className="rounded-lg bg-white p-3 font-mono text-xs space-y-1">
            <p><span className="text-gray-500">URL:</span> {window.location.origin}/delivery/login</p>
            <p><span className="text-gray-500">Email:</span> {lastCreated.email}</p>
            <p className="flex items-center gap-2">
              <span className="text-gray-500">Password:</span>
              {showPass ? lastCreated.password : '••••••••••'}
              <button onClick={() => setShowPass(s => !s)} className="text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </p>
          </div>
          <button
            onClick={copyCredentials}
            className={`mt-3 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
              copied ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Credentials'}
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">New Delivery Boy Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Username *</label>
              <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" placeholder="Ram Bahadur" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" placeholder="ram@delivery.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone Number</label>
              <input type="text" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" placeholder="9841234567" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Password (blank = auto-generate)</label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" placeholder="Min 6 chars" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryBoys.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No delivery boys yet</p>
                    <p className="text-xs text-gray-400 mt-1">Create an account to start assigning deliveries</p>
                  </td>
                </tr>
              ) : (
                deliveryBoys.map((boy) => (
                  <tr key={boy.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-600">{boy.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">{boy.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{boy.email}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(boy.createdAt).toLocaleDateString('en-NP')}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(boy.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
