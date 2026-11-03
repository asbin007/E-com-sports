import { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Category } from '@/types';
import { Plus, Trash2, Loader2, X, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '@/utils/apiError';

interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  Category?: { id: string; name: string };
}

export default function ProductTypes() {
  const [items, setItems] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [ptRes, cRes] = await Promise.all([
          api.get('/product-types'),
          api.get('/categories'),
        ]);
        setItems(ptRes.data?.data || []);
        setCategories(cRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');
    if (!categoryId) return toast.error('Select a category');
    setSaving(true);
    try {
      const res = await api.post('/product-types', { name, description, categoryId });
      setItems((prev) => [...prev, res.data?.data]);
      setShowForm(false);
      setName('');
      setDescription('');
      setCategoryId('');
      toast.success('Product type created');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product type?')) return;
    try {
      await api.delete(`/product-types/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Product type deleted');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete'));
    }
  };

  const getCategoryName = (item: ProductType) => {
    return item.Category?.name || categories.find((c) => c.id === item.categoryId)?.name || '-';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Types</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} types — linked to categories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600"
        >
          <Plus className="w-4 h-4" /> Add Type
        </button>
      </div>

      {/* How it works */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="text-sm text-orange-800 font-medium mb-1">How categories & types work:</p>
        <ul className="text-xs text-orange-700 space-y-1">
          <li>• <strong>Category</strong> = broad group (Football Boots, Club Jerseys, Trophies &amp; Medals, Bags)</li>
          <li>• <strong>Product Type</strong> = specific type under a category (Firm Ground Boot, Away Jersey, Match Ball, Trophy)</li>
          <li>• The category determines the <strong>size system</strong> (clothing sizes, shoe sizes, etc.)</li>
          <li>• When adding a product, you pick category first → then type is filtered</li>
        </ul>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add Product Type</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jersey, Football Boot, Bat"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
              <th className="px-5 py-3 font-medium">Type Name</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No product types yet</p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      {getCategoryName(item)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{item.description || '-'}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
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
  );
}
