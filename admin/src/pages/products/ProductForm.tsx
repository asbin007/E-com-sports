import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';
import type { Category, Brand, Sport, ProductType, Product } from '@/types';
import { ArrowLeft, Plus, Trash2, Upload, Star, Loader2, Wand2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface VariantRow {
  size: string;
  color: string;
  price: number;
  originalPrice: number;
  costPrice: number;
  stock: number;
  isActive: boolean;
}

interface AttributeRow {
  key: string;
  value: string;
}

type SizeType = 'clothing' | 'shoe' | 'weight' | 'equipment' | null;

const SIZE_PRESETS: Record<Exclude<SizeType, null>, string[]> = {
  shoe: ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'],
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  weight: ['Short Handle', 'Long Handle', 'Harrow', 'Full Size'],
  equipment: ['Size 3', 'Size 4', 'Size 5', 'One Size'],
};

const COLOR_PRESETS = ['Black', 'White', 'Red', 'Blue', 'Navy', 'Green', 'Yellow', 'Grey', 'Maroon', 'Gold'];

const sizeLabel = (t: SizeType) => {
  if (t === 'shoe') return 'Shoe Size';
  if (t === 'weight') return 'Handle / Weight';
  if (t === 'equipment') return 'Variant';
  return 'Size';
};

const blankVariant = (size = ''): VariantRow => ({
  size, color: '', price: 0, originalPrice: 0, costPrice: 0, stock: 0, isActive: true,
});

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500';

// ─── Inline Create Select ───────────────────────────────────────────────────
interface SelectWithCreateProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { id: string; name: string }[];
  createEndpoint: string;
  createFields: { key: string; label: string; type?: 'text' | 'select'; options?: { value: string; label: string }[]; required?: boolean }[];
  onCreated: (item: any) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

function SelectWithCreate({
  label, value, onChange, options, createEndpoint, createFields, onCreated,
  placeholder = 'Select...', required, disabled,
}: SelectWithCreateProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setSaving(true);
    try {
      const res = await api.post(createEndpoint, formData);
      const newItem = res.data?.data;
      if (newItem) {
        onCreated(newItem);
        onChange(newItem.id);
        toast.success(`${label} created`);
      }
      setShowCreate(false);
      setFormData({});
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to create ${label.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 ${inputClass}`}
          required={required}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-gray-500 hover:text-orange-500 hover:border-orange-500 transition-colors flex-shrink-0"
          title={`Create new ${label.toLowerCase()}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Inline Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCreate(false); setFormData({}); }}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">New {label}</h3>
              <button type="button" onClick={() => { setShowCreate(false); setFormData({}); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {createFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.label}
                      className={inputClass}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowCreate(false); setFormData({}); }} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="button" disabled={saving} onClick={handleCreate} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-1.5">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Form ──────────────────────────────────────────────────────────────

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sportId, setSportId] = useState('');
  const [productTypeId, setProductTypeId] = useState('');
  const [gender, setGender] = useState('Unisex');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [allowCustomization, setAllowCustomization] = useState(false);

  // Features & Attributes
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [customAttrs, setCustomAttrs] = useState<AttributeRow[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Images
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [existingImages, setExistingImages] = useState<{ id?: string; url: string; isThumbnail?: boolean }[]>([]);

  // Variants
  const [variants, setVariants] = useState<VariantRow[]>([blankVariant()]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateColors, setGenerateColors] = useState<string[]>(['Black']);
  const [generatePrice, setGeneratePrice] = useState(0);
  const [generateOriginalPrice, setGenerateOriginalPrice] = useState(0);
  const [generateCostPrice, setGenerateCostPrice] = useState(0);
  const [generateStock, setGenerateStock] = useState(10);

  // Derived
  const selectedCategory = useMemo(() => categories.find((c) => c.id === categoryId), [categories, categoryId]);
  const sizeType: SizeType = selectedCategory?.sizeType as SizeType ?? null;
  const needsSize = selectedCategory?.needsSize ?? true;
  const sizeOptions = sizeType ? SIZE_PRESETS[sizeType] : [];
  const filteredProductTypes = useMemo(() => productTypes.filter((pt) => pt.categoryId === categoryId), [productTypes, categoryId]);

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, bRes, sRes, ptRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
          api.get('/sports').catch(() => ({ data: { data: [] } })),
          api.get('/product-types'),
        ]);
        setCategories(cRes.data?.data || []);
        setBrands(bRes.data?.data || []);
        setSports(sRes.data?.data || []);
        setProductTypes(ptRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load form data:', err);
      }
    };
    load();
  }, []);

  // Load product for edit
  useEffect(() => {
    if (!isEdit || !id) return;
    setInitialLoading(true);
    api.get(`/products/${id}`)
      .then((res) => {
        const p: Product = res.data?.data;
        if (!p) return;
        setName(p.name || '');
        setDescription(p.description || '');
        setBrandId(p.brandId || '');
        setCategoryId(p.categoryId || '');
        setSportId(p.sportId || '');
        setProductTypeId(p.productTypeId || '');
        setGender(p.gender || 'Unisex');
        setIsActive(p.isActive ?? true);
        setIsFeatured(p.isFeatured ?? false);
        setAllowCustomization(p.allowCustomization ?? false);

        const vars = p.variants || p.Variants || [];
        if (vars.length > 0) {
          setVariants(vars.map((v) => ({
            size: v.size || '', color: v.color || '', price: v.price || 0,
            originalPrice: v.originalPrice || 0, costPrice: v.costPrice || 0,
            stock: v.stock || 0, isActive: v.isActive ?? true,
          })));
        }

        const imgs = p.images || p.ProductImages || [];
        setExistingImages(imgs.map((img) => ({ id: img.id, url: img.url, isThumbnail: img.isThumbnail })));

        const attrs = p.attributes || p.ProductAttributes || [];
        const featList = attrs.filter((a) => a.attributeName.toLowerCase() === 'feature').map((a) => a.attributeValue);
        setFeatures(featList);
        const customList = attrs.filter((a) => a.attributeName.toLowerCase() !== 'feature');
        setCustomAttrs(customList.map((a) => ({ key: a.attributeName, value: a.attributeValue })));

        if (p.tags) setTags(p.tags);
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setInitialLoading(false));
  }, [isEdit, id]);

  // Load duplicate data if coming from "Duplicate" action
  useEffect(() => {
    if (isEdit) return;
    const raw = sessionStorage.getItem('duplicate_product');
    if (!raw) return;
    try {
      const p = JSON.parse(raw);
      sessionStorage.removeItem('duplicate_product');
      setName(p.name || '');
      setDescription(p.description || '');
      setBrandId(p.brandId || '');
      setCategoryId(p.categoryId || '');
      setSportId(p.sportId || '');
      setProductTypeId(p.productTypeId || '');
      setGender(p.gender || 'Unisex');
      setIsFeatured(p.isFeatured ?? false);
      setAllowCustomization(p.allowCustomization ?? false);
      if (p.tags) setTags(p.tags);
      if (p.variants && p.variants.length > 0) {
        setVariants(p.variants);
      }
    } catch { /* ignore */ }
  }, [isEdit]);

  // Reset productTypeId when category changes (but not on initial set)
  const prevCategoryIdRef = useRef('');
  useEffect(() => {
    // Skip the first run (initial load)
    if (prevCategoryIdRef.current === '' && categoryId !== '') {
      prevCategoryIdRef.current = categoryId;
      return;
    }
    prevCategoryIdRef.current = categoryId;

    setProductTypeId('');
    if (!needsSize) {
      setVariants((prev) => prev.map((v) => ({ ...v, size: 'One Size' })));
    } else if (sizeOptions.length > 0) {
      setVariants((prev) => prev.map((v) => ({
        ...v,
        size: sizeOptions.includes(v.size) ? v.size : sizeOptions[0],
      })));
    }
  }, [categoryId]);

  // Handlers
  const addFeature = () => {
    const t = featureInput.trim();
    if (t && !features.includes(t)) { setFeatures((prev) => [...prev, t]); setFeatureInput(''); }
  };
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags((prev) => [...prev, t]); setTagInput(''); }
  };
  const addVariant = () => setVariants((prev) => [...prev, blankVariant(needsSize ? sizeOptions[0] || '' : 'One Size')]);
  const removeVariant = (i: number) => { if (variants.length > 1) setVariants((prev) => prev.filter((_, idx) => idx !== i)); };
  const updateVariant = (i: number, field: keyof VariantRow, val: any) => {
    setVariants((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
  };

  const generateVariants = () => {
    const sizes = needsSize ? sizeOptions : ['One Size'];
    const colors = generateColors.length > 0 ? generateColors : [''];
    const newVars: VariantRow[] = [];
    sizes.forEach((s) => colors.forEach((c) => newVars.push({
      size: s,
      color: c,
      price: generatePrice,
      originalPrice: generateOriginalPrice,
      costPrice: generateCostPrice,
      stock: generateStock,
      isActive: true,
    })));
    setVariants(newVars);
    setShowGenerateModal(false);
    toast.success(`Generated ${newVars.length} variants`);
  };

  const openGenerateModal = () => {
    // Pre-fill price from first existing variant
    const firstVar = variants[0];
    setGeneratePrice(firstVar?.price || 0);
    setGenerateOriginalPrice(firstVar?.originalPrice || 0);
    setGenerateCostPrice(firstVar?.costPrice || 0);
    setGenerateStock(firstVar?.stock || 10);
    setGenerateColors(['Black']);
    setShowGenerateModal(true);
  };

  const toggleGenerateColor = (color: string) => {
    setGenerateColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 6 - (existingImages.length + images.length);
    if (remaining <= 0) return toast.error('Max 6 images');
    const accepted = files.filter((f) => f.size <= 5 * 1024 * 1024).slice(0, remaining);
    setImages((prev) => [...prev, ...accepted]);
    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Product name is required');
    if (!brandId) return toast.error('Select a brand');
    if (!categoryId) return toast.error('Select a category');
    if (variants.some((v) => v.price <= 0)) return toast.error('All variants need a price');
    if (!isEdit && images.length === 0 && existingImages.length === 0) return toast.error('Add at least one image');

    setLoading(true);
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('description', description);
    formData.append('brandId', brandId);
    formData.append('categoryId', categoryId);
    formData.append('productTypeId', productTypeId);
    if (sportId) formData.append('sportId', sportId);
    formData.append('gender', gender);
    formData.append('isActive', String(isActive));
    formData.append('isFeatured', String(isFeatured));
    formData.append('allowCustomization', String(allowCustomization));
    if (tags.length > 0) formData.append('tags', JSON.stringify(tags));

    const cleanVariants = variants.map((v) => ({
      size: v.size, color: v.color || null,
      price: Number(v.price) || 0, originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
      costPrice: v.costPrice ? Number(v.costPrice) : null, stock: Number(v.stock) || 0,
      isActive: v.isActive !== false,
    }));
    formData.append('variants', JSON.stringify(cleanVariants));

    const allAttrs: { attributeName: string; attributeValue: string }[] = [];
    features.forEach((f) => allAttrs.push({ attributeName: 'Feature', attributeValue: f }));
    customAttrs.filter((a) => a.key.trim() && a.value.trim()).forEach((a) => allAttrs.push({ attributeName: a.key.trim(), attributeValue: a.value.trim() }));
    if (allAttrs.length > 0) formData.append('attributes', JSON.stringify(allAttrs));

    images.forEach((file) => formData.append('images', file));
    formData.append('thumbnailIndex', String(thumbnailIndex));

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated');
      } else {
        await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created');
      }
      if (!(window as any).__stayOnPage) {
        navigate('/products');
      }
    } catch (err: any) {
      (window as any).__stayOnPage = false; // Don't reset form on error
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/products')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
        <p className="text-sm text-gray-500 mt-1">You can create new brands, categories, types, and sports right from here</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Images ({existingImages.length + images.length}/6)</h2>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((img, i) => (
              <div key={img.id || `e-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border group">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {img.isThumbnail && <div className="absolute top-1 left-1 bg-yellow-400 rounded-full p-0.5"><Star className="h-3 w-3 text-white" /></div>}
                <button type="button" onClick={() => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Trash2 className="h-4 w-4 text-white" /></button>
              </div>
            ))}
            {imagePreviews.map((src, i) => (
              <div key={`n-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-orange-300 group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <span className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-bold px-1 rounded">NEW</span>
                <button type="button" onClick={() => { setImages((prev) => prev.filter((_, idx) => idx !== i)); setImagePreviews((prev) => prev.filter((_, idx) => idx !== i)); }} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Trash2 className="h-4 w-4 text-white" /></button>
              </div>
            ))}
            {(existingImages.length + images.length) < 6 && (
              <button type="button" onClick={() => document.getElementById('img-upload')?.click()} className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors">
                <Upload className="h-5 w-5" />
                <span className="text-xs mt-1">Add</span>
              </button>
            )}
          </div>
          <input id="img-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nepal National Team Jersey 2024" className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the product..." className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectWithCreate
              label="Category"
              value={categoryId}
              onChange={setCategoryId}
              options={categories}
              createEndpoint="/categories"
              createFields={[
                { key: 'name', label: 'Category Name', required: true },
                { key: 'sizeType', label: 'Size Type', type: 'select', options: [
                  { value: 'clothing', label: 'Clothing (S/M/L/XL)' },
                  { value: 'shoe', label: 'Shoes (UK sizes)' },
                  { value: 'weight', label: 'Weight/Handle' },
                  { value: 'equipment', label: 'Equipment' },
                ]},
                { key: 'needsSize', label: 'Requires Size', type: 'select', options: [
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]},
              ]}
              onCreated={(item) => setCategories((prev) => [...prev, item])}
              placeholder="Select category"
              required
            />
            <SelectWithCreate
              label="Brand"
              value={brandId}
              onChange={setBrandId}
              options={brands}
              createEndpoint="/brands"
              createFields={[
                { key: 'name', label: 'Brand Name', required: true },
              ]}
              onCreated={(item) => setBrands((prev) => [...prev, item])}
              placeholder="Select brand"
              required
            />
            <SelectWithCreate
              label="Product Type"
              value={productTypeId}
              onChange={setProductTypeId}
              options={filteredProductTypes}
              createEndpoint="/product-types"
              createFields={[
                { key: 'name', label: 'Type Name', required: true },
                { key: 'description', label: 'Description' },
                { key: 'categoryId', label: 'Category', type: 'select', options: categories.map((c) => ({ value: c.id, label: c.name })), required: true },
              ]}
              onCreated={(item) => setProductTypes((prev) => [...prev, item])}
              placeholder={categoryId ? 'Select type (optional)' : 'Select category first'}
              disabled={!categoryId}
            />
            <SelectWithCreate
              label="Sport"
              value={sportId}
              onChange={(val) => setSportId(val === '' ? '' : val)}
              options={sports}
              createEndpoint="/sports"
              createFields={[
                { key: 'name', label: 'Sport Name', required: true },
              ]}
              onCreated={(item) => setSports((prev) => [...prev, item])}
              placeholder="None (optional)"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                {['Unisex', 'Men', 'Women', 'Kids'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          {selectedCategory && (
            <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              {needsSize ? `Size system: ${sizeLabel(sizeType)} — ${sizeOptions.join(', ')}` : 'This category does not require sizing'}
            </p>
          )}
        </div>

        {/* Pricing & Inventory — Shopify Style */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pricing</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Selling Price <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs</span>
                <input type="number" min={0} value={variants[0]?.price || ''} onChange={(e) => { const p = Number(e.target.value); setVariants((prev) => prev.map((v) => ({ ...v, price: p }))); }} placeholder="2500" className={`${inputClass} pl-9`} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Compare at (MRP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs</span>
                <input type="number" min={0} value={variants[0]?.originalPrice || ''} onChange={(e) => { const p = Number(e.target.value); setVariants((prev) => prev.map((v) => ({ ...v, originalPrice: p }))); }} placeholder="3500" className={`${inputClass} pl-9`} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Cost per item</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs</span>
                <input type="number" min={0} value={variants[0]?.costPrice || ''} onChange={(e) => { const p = Number(e.target.value); setVariants((prev) => prev.map((v) => ({ ...v, costPrice: p }))); }} placeholder="1200" className={`${inputClass} pl-9`} />
              </div>
            </div>
          </div>
          {variants[0]?.price > 0 && variants[0]?.originalPrice > 0 && variants[0].originalPrice > variants[0].price && (
            <p className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
              💰 {Math.round((1 - variants[0].price / variants[0].originalPrice) * 100)}% discount from MRP
              {variants[0].costPrice > 0 && ` • Margin: Rs ${variants[0].price - variants[0].costPrice} (${Math.round((1 - variants[0].costPrice / variants[0].price) * 100)}%)`}
            </p>
          )}
        </div>

        {/* Variants — Shopify Style: Options */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Options & Variants</h2>
            <span className="text-xs text-gray-400">{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Size Selection — Checkbox grid */}
          {needsSize && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => {
                  const isSelected = variants.some((v) => v.size === size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          // Remove variants with this size (keep at least 1)
                          const remaining = variants.filter((v) => v.size !== size);
                          if (remaining.length > 0) setVariants(remaining);
                        } else {
                          // Add variants for this size (for each existing color)
                          const existingColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
                          const baseVar = variants[0];
                          if (existingColors.length > 0) {
                            const newVars = existingColors.map((c) => ({ ...blankVariant(size), color: c, price: baseVar.price, originalPrice: baseVar.originalPrice, costPrice: baseVar.costPrice, stock: baseVar.stock }));
                            setVariants((prev) => [...prev, ...newVars]);
                          } else {
                            setVariants((prev) => [...prev, { ...blankVariant(size), price: baseVar.price, originalPrice: baseVar.originalPrice, costPrice: baseVar.costPrice, stock: baseVar.stock }]);
                          }
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => {
                  const baseVar = variants[0];
                  const existingColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
                  const allSizeVars: VariantRow[] = [];
                  sizeOptions.forEach((size) => {
                    if (existingColors.length > 0) {
                      existingColors.forEach((c) => allSizeVars.push({ ...blankVariant(size), color: c, price: baseVar.price, originalPrice: baseVar.originalPrice, costPrice: baseVar.costPrice, stock: baseVar.stock }));
                    } else {
                      allSizeVars.push({ ...blankVariant(size), price: baseVar.price, originalPrice: baseVar.originalPrice, costPrice: baseVar.costPrice, stock: baseVar.stock });
                    }
                  });
                  setVariants(allSizeVars);
                }} className="text-xs text-orange-600 hover:text-orange-700 font-medium">Select All</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={() => {
                  const baseVar = variants[0];
                  setVariants([{ ...blankVariant(sizeOptions[0] || ''), price: baseVar.price, originalPrice: baseVar.originalPrice, costPrice: baseVar.costPrice, stock: baseVar.stock }]);
                }} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Clear</button>
              </div>
            </div>
          )}

          {/* Color Selection — Tag input with presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_PRESETS.map((color) => {
                const isSelected = variants.some((v) => v.color === color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      const baseVar = variants[0];
                      if (isSelected) {
                        // Remove this color from all variants, or clear color if only one
                        const withoutColor = variants.filter((v) => v.color !== color);
                        if (withoutColor.length > 0) {
                          setVariants(withoutColor);
                        } else {
                          setVariants(variants.map((v) => ({ ...v, color: '' })));
                        }
                      } else {
                        // Add this color for all existing sizes
                        const existingSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
                        if (existingSizes.length > 0 && needsSize) {
                          const newVars = existingSizes.map((s) => ({ ...blankVariant(s), color, price: baseVar.price, originalPrice: baseVar.originalPrice, costPrice: baseVar.costPrice, stock: baseVar.stock }));
                          // Remove variants with empty color, add colored ones
                          const existingWithColor = variants.filter((v) => v.color && v.color !== color);
                          setVariants([...existingWithColor, ...newVars]);
                        } else {
                          // No sizes or single variant — just set/add color
                          if (variants.length === 1 && !variants[0].color) {
                            setVariants([{ ...variants[0], color }]);
                          } else {
                            setVariants((prev) => [...prev, { ...blankVariant(needsSize ? (sizeOptions[0] || '') : 'One Size'), color, price: baseVar.price, originalPrice: baseVar.originalPrice, costPrice: baseVar.costPrice, stock: baseVar.stock }]);
                          }
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                      isSelected
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Type custom color + Enter..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const color = (e.target as HTMLInputElement).value.trim();
                  if (!color) return;
                  const baseVar = variants[0];
                  const existingSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
                  if (existingSizes.length > 0 && needsSize) {
                    const newVars = existingSizes.map((s) => ({ ...blankVariant(s), color, price: baseVar.price, originalPrice: baseVar.originalPrice, costPrice: baseVar.costPrice, stock: baseVar.stock }));
                    const existingWithColor = variants.filter((v) => v.color);
                    setVariants([...existingWithColor, ...newVars]);
                  } else {
                    if (variants.length === 1 && !variants[0].color) {
                      setVariants([{ ...variants[0], color }]);
                    } else {
                      setVariants((prev) => [...prev, { ...blankVariant(needsSize ? (sizeOptions[0] || '') : 'One Size'), color, price: baseVar.price, originalPrice: baseVar.originalPrice, costPrice: baseVar.costPrice, stock: baseVar.stock }]);
                    }
                  }
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
          </div>

          {/* Stock per variant */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Stock per variant</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Set all:</span>
                <input type="number" min={0} placeholder="10" className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = Number((e.target as HTMLInputElement).value);
                      setVariants((prev) => prev.map((v) => ({ ...v, stock: val })));
                      toast.success(`Stock set to ${val} for all`);
                    }
                  }} />
              </div>
            </div>

            {/* Compact variant grid showing only what matters */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_80px] gap-0 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-2 border-b">
                <span>Variant</span>
                <span className="text-center">Stock</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px] gap-0 items-center px-3 py-2 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-800 font-medium">
                        {needsSize ? v.size : 'Default'}
                        {v.color && <span className="text-gray-400 font-normal"> / {v.color}</span>}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={v.stock || ''}
                      onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-center focus:border-orange-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Total stock: <span className="font-medium text-gray-600">{variants.reduce((sum, v) => sum + (v.stock || 0), 0)}</span> units across {variants.length} variants
            </p>
          </div>
        </div>

        {/* Features & Attributes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Features & Attributes</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Features</label>
            <div className="flex gap-2">
              <input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder="Add a feature..." className={`flex-1 ${inputClass}`} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} />
              <button type="button" onClick={addFeature} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
            </div>
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">{f}<button type="button" onClick={() => setFeatures((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button></span>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Custom Attributes</label>
              <button type="button" onClick={() => setCustomAttrs((prev) => [...prev, { key: '', value: '' }])} className="text-xs text-orange-500 font-medium">+ Add</button>
            </div>
            {customAttrs.map((a, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={a.key} onChange={(e) => setCustomAttrs((prev) => prev.map((x, idx) => idx === i ? { ...x, key: e.target.value } : x))} placeholder="e.g. Material" className={`flex-1 ${inputClass}`} />
                <input value={a.value} onChange={(e) => setCustomAttrs((prev) => prev.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} placeholder="e.g. English Willow" className={`flex-1 ${inputClass}`} />
                <button type="button" onClick={() => setCustomAttrs((prev) => prev.filter((_, idx) => idx !== i))} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag..." className={`flex-1 ${inputClass}`} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
              <button type="button" onClick={addTag} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">#{t}<button type="button" onClick={() => setTags((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button></span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Settings</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm text-gray-700">Active (visible on store)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm text-gray-700">Featured (home page)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={allowCustomization} onChange={(e) => setAllowCustomization(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm text-gray-700">Allow Customization (jersey name/number)</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate('/products')} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          {!isEdit && (
            <button
              type="button"
              disabled={loading}
              onClick={async (e) => {
                // Save & Add Another — submit then reset form instead of navigating away
                const form = (e.target as HTMLElement).closest('form');
                if (!form) return;
                const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                // Temporarily override navigate to stay on page
                const origNav = navigate;
                (window as any).__stayOnPage = true;
                await handleSubmit(fakeEvent);
                if ((window as any).__stayOnPage) {
                  // Reset form for next product
                  setName(''); setDescription(''); setImages([]); setImagePreviews([]);
                  setExistingImages([]); setVariants([blankVariant()]);
                  setFeatures([]); setCustomAttrs([]); setTags([]);
                  window.scrollTo(0, 0);
                }
                delete (window as any).__stayOnPage;
              }}
              className="flex-1 py-2.5 border-2 border-orange-500 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save & Add Another'}
            </button>
          )}
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
