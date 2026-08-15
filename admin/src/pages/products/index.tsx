import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Product } from '@/types';
import { Plus, Search, Edit, Trash2, Star, Package, Eye, EyeOff, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState(''); // 'low' | 'out' | ''
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { limit: 200 } });
      setProducts(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await api.put(`/products/${product.id}`, { isActive: !product.isActive });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
      toast.success(product.isActive ? 'Product hidden' : 'Product activated');
    } catch (err: any) {
      toast.error('Failed to update product');
    }
  };

  const handleDuplicate = (product: Product) => {
    // Store product data in sessionStorage for the form to pick up
    const duplicateData = {
      name: `${product.name} (Copy)`,
      description: product.description || '',
      brandId: product.brandId,
      categoryId: product.categoryId,
      sportId: product.sportId || '',
      productTypeId: product.productTypeId || '',
      gender: product.gender || 'Unisex',
      isFeatured: product.isFeatured,
      allowCustomization: product.allowCustomization,
      tags: product.tags || [],
      variants: (product.variants || product.Variants || []).map((v) => ({
        size: v.size, color: v.color, price: v.price,
        originalPrice: v.originalPrice || 0, costPrice: v.costPrice || 0,
        stock: v.stock, isActive: v.isActive,
      })),
    };
    sessionStorage.setItem('duplicate_product', JSON.stringify(duplicateData));
    navigate('/products/new?duplicate=true');
    toast.success('Product duplicated — edit name and images');
  };

  // Get unique categories for filter
  const categoryNames = [...new Set(products.map((p) => p.Category?.name).filter(Boolean))] as string[];

  const getStock = (p: Product) => {
    const vars = p.variants || p.Variants || [];
    return vars.reduce((sum, v) => sum + (v.stock || 0), 0);
  };

  const getPrice = (p: Product) => {
    const vars = p.variants || p.Variants || [];
    return vars[0]?.price || 0;
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.Brand?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.Category?.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || p.Category?.name === categoryFilter;
    const stock = getStock(p);
    const matchStock = !stockFilter ||
      (stockFilter === 'out' && stock === 0) ||
      (stockFilter === 'low' && stock > 0 && stock <= 5);
    return matchSearch && matchCategory && matchStock;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products total</p>
        </div>
        <Link
          to="/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <option value="">All Categories</option>
          {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <option value="">All Stock</option>
          <option value="low">Low Stock (≤5)</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No products found</p>
                    <Link to="/products/new" className="text-orange-500 text-sm font-medium hover:underline mt-1 inline-block">
                      Add your first product
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const stock = getStock(product);
                  const price = getPrice(product);
                  const images = product.images || product.ProductImages || [];
                  const thumbnail = images.find((img) => img.isThumbnail) || images[0];

                  return (
                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {thumbnail ? (
                              <img src={thumbnail.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {product.isFeatured && (
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              )}
                              {product.allowCustomization && (
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Custom</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{product.Category?.name || '-'}</td>
                      <td className="px-5 py-3 text-gray-600">{product.Brand?.name || '-'}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">Rs {price.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`font-medium ${stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {stock}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/products/${product.id}/edit`}
                            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleActive(product)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title={product.isActive ? 'Hide' : 'Show'}
                          >
                            {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-500" />}
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
