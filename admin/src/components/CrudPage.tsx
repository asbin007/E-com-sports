import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage, getApiErrorStatus } from '@/utils/apiError';

interface CrudItem {
  id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

interface CrudPageProps {
  title: string;
  /** Collection path, with NO query string — `${endpoint}/${id}` is used for writes. */
  endpoint: string;
  /**
   * Query string appended to the LIST request only (e.g. `includeInactive=true`).
   * Keeping it out of `endpoint` matters: the edit and delete URLs append the id,
   * so a query string there would produce `/categories?x=1/<id>`.
   */
  listQuery?: string;
  fields: { key: string; label: string; type?: 'text' | 'select'; options?: { value: string; label: string }[]; required?: boolean }[];
  renderItem?: (item: CrudItem) => React.ReactNode;
}

export default function CrudPage({ title, endpoint, listQuery, fields, renderItem }: CrudPageProps) {
  const [items, setItems] = useState<CrudItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<CrudItem | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get(listQuery ? `${endpoint}?${listQuery}` : endpoint);
      setItems(res.data?.data || []);
    } catch (err) {
      console.error(`Failed to fetch ${title}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, listQuery, title]);

  useEffect(() => {
    const run = async () => {
      await fetchItems();
    };
    run();
  }, [fetchItems]);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({});
    setShowForm(true);
  };

  const openEdit = (item: CrudItem) => {
    setEditingItem(item);
    setFormData(
      fields.reduce<Record<string, string>>((acc, field) => {
        const value = item[field.key];
        acc[field.key] = value === null || value === undefined ? '' : String(value);
        return acc;
      }, {})
    );
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({});
  };

  // Close the modal on Escape — but never while a save is in flight, so an
  // accidental keypress can't discard input that hasn't been persisted yet.
  useEffect(() => {
    if (!showForm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) closeForm();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showForm, saving]);

  // On failure this deliberately leaves the modal open with its input intact so
  // the operator can correct and retry instead of retyping everything.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`${endpoint}/${editingItem.id}`, formData);
        // Update responses return only a message, and the server derives fields
        // such as slug — so re-read the list rather than guessing the new row.
        await fetchItems();
        toast.success(`${editingItem.name} updated`);
      } else {
        const res = await api.post(endpoint, formData);
        setItems((prev) => [...prev, res.data?.data]);
        toast.success(`${title} created`);
      }
      closeForm();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, `Failed to ${editingItem ? 'update' : 'create'} ${title.toLowerCase()}`)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: CrudItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`${endpoint}/${item.id}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(`${item.name} deleted`);
    } catch (err) {
      // 409 means the server refused because rows still depend on this one.
      // That message names the blocker, so give the operator time to read it.
      toast.error(getApiErrorMessage(err, `Failed to delete "${item.name}"`), {
        duration: getApiErrorStatus(err) === 409 ? 8000 : 4000,
      });
    }
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
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} {title.toLowerCase()} total</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add {title}
        </button>
      </div>

      {/* Create / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="crud-form-title"
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="crud-form-title" className="text-lg font-bold text-gray-900">
                {editingItem ? `Edit ${editingItem.name}` : `Add ${title}`}
              </h2>
              <button
                onClick={closeForm}
                aria-label="Close dialog"
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.key}>
                  <label htmlFor={`crud-field-${field.key}`} className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      id={`crud-field-${field.key}`}
                      autoFocus={index === 0}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required={field.required}
                    >
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`crud-field-${field.key}`}
                      type="text"
                      autoFocus={index === 0}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required={field.required}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingItem ? 'Save changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[32rem]">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Slug</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center text-gray-400">
                  No {title.toLowerCase()} yet. Click "Add {title}" to create one.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {renderItem ? renderItem(item) : item.name}
                  </td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{item.slug}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(item)}
                      aria-label={`Edit ${item.name}`}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      aria-label={`Delete ${item.name}`}
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
