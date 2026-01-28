import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Loader2,
  Check,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import api from "../../api";

interface Option {
  id: string;
  name: string;
}

const STEPS = [
  { id: 1, title: "Basic Info", description: "Name, brand, and category" },
  { id: 2, title: "Attributes", description: "Sizes, colors, and features" },
  { id: 3, title: "Pricing & Inventory", description: "Price, SKU, and stock" },
  { id: 4, title: "Media", description: "Product images" },
];

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Data Options
  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [productTypes, setProductTypes] = useState<Option[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount: "",
    originalPrice: "",
    stock: "",
    sizes: "",
    colors: "",
    features: "",
    isNew: false,
    categoryId: "",
    brandId: "",
    productTypeId: "",
    gender: "Unisex",
    sku: "",
    images: [] as File[],
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catsRes, brandsRes, typesRes] = await Promise.all([
          api.get("/categories"),
          api.get("/brands"),
          api.get("/product-types"),
        ]);
        setCategories(catsRes.data.data);
        setBrands(brandsRes.data.data);
        setProductTypes(typesRes.data.data);
      } catch (error) {
        console.error("Failed to fetch options", error);
      }
    };

    fetchOptions();

    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          const response = await api.get(`/products/${id}`);
          const product = response.data.data;
          setFormData({
            ...product,
            categoryId: product.categoryId,
            brandId: product.brandId,
            productTypeId: product.productTypeId,
            price: product.price ? product.price.toString() : "",
            originalPrice: product.originalPrice
              ? product.originalPrice.toString()
              : "",
            stock: product.stock ? product.stock.toString() : "",
            discount: product.discount ? product.discount.toString() : "",
            sizes:
              product.sizes && Array.isArray(product.sizes)
                ? product.sizes.join(", ")
                : "",
            colors:
              product.colors && Array.isArray(product.colors)
                ? product.colors.join(", ")
                : "",
            features:
              product.features && Array.isArray(product.features)
                ? product.features.join("\n")
                : "",
            isNew: product.isNew || false,
            sku: product.sku || "",
            images: [],
          });
        } catch (error) {
          console.error("Failed to fetch product", error);
        } finally {
          setInitialLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode]);

  // Calculations Logic: Listen to changes in formData
  const handlePriceCalculation = (name: string, value: string) => {
    if (name === "originalPrice" || name === "price") {
      // If MRP or Selling Price changes -> Calculate Discount
      const mrp =
        name === "originalPrice"
          ? parseFloat(value)
          : parseFloat(formData.originalPrice);
      const selling =
        name === "price" ? parseFloat(value) : parseFloat(formData.price);

      if (mrp && selling && mrp > 0) {
        const discountPercent = Math.round(((mrp - selling) / mrp) * 100);
        return { discount: discountPercent.toString() };
      }
    } else if (name === "discount") {
      // If Discount changes -> Calculate Selling Price
      const discount = parseFloat(value);
      const mrp = parseFloat(formData.originalPrice);

      if (mrp && !isNaN(discount)) {
        const selling = Math.round(mrp - mrp * (discount / 100));
        return { price: selling.toString() };
      }
    }
    return {};
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    // Auto Calculate
    let updates = {};
    if (name === "price" || name === "originalPrice" || name === "discount") {
      updates = handlePriceCalculation(name, value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...updates,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        images: Array.from(e.target.files || []),
      }));
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.name) return "Product Name is required";
        if (!formData.categoryId) return "Category is required";
        if (!formData.brandId) return "Brand is required";
        if (!formData.productTypeId) return "Product Type is required";
        return null;
      case 2:
        return null; // Attributes optional
      case 3:
        if (!formData.price) return "Selling Price is required";
        if (!formData.stock) return "Stock is required";
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      alert(error);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "images") {
          formData.images.forEach((file) => data.append("images", file));
        } else {
          data.append(key, String(value));
        }
      });

      if (isEditMode) {
        await api.put(`/products/${id}`, data);
      } else {
        await api.post("/products", data);
      }
      navigate("/products");
    } catch (error) {
      console.error("Failed to save product", error);
      alert("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-stone-950" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/products")}
            className="p-2 bg-white hover:bg-gray-100 rounded-full transition-colors border border-gray-200 shadow-sm"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Product" : "Create Product"}
            </h1>
            <p className="text-sm text-gray-500">
              Fill in the details below to {isEditMode ? "update" : "add"} your
              product
            </p>
          </div>
        </div>

        <div className="flex gap-8 items-start">
          {/* Sidebar Stepper */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-8">
              <div className="space-y-6">
                {STEPS.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div key={step.id} className="relative">
                      <div
                        className={`flex items-start gap-4 ${isActive ? "opacity-100" : "opacity-60"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-stone-950 text-white shadow-lg shadow-stone-950/20"
                              : isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isCompleted ? <Check size={16} /> : step.id}
                        </div>
                        <div className="flex-1 pt-1">
                          <h3
                            className={`text-sm font-medium ${isActive ? "text-stone-950" : "text-gray-600"}`}
                          >
                            {step.title}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {step.id !== STEPS.length && (
                        <div
                          className={`absolute left-4 top-8 w-0.5 h-8 -ml-px ${isCompleted ? "bg-green-500" : "bg-gray-100"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8">
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      {/* Name */}
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950 transition-all"
                        placeholder="e.g. Nike Air Max"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950 transition-all resize-none"
                        placeholder="Describe your product..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950 bg-white"
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand *
                      </label>
                      <select
                        name="brandId"
                        value={formData.brandId}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950 bg-white"
                      >
                        <option value="">Select Brand</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Type *
                      </label>
                      <select
                        name="productTypeId"
                        value={formData.productTypeId}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950 bg-white"
                      >
                        <option value="">Select Type</option>
                        {productTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950 bg-white"
                      >
                        <option value="Unisex">Unisex</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 flex items-start gap-3">
                    <div className="mt-1">
                      <AlertTriangle size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          name="isNew"
                          id="isNew"
                          checked={formData.isNew}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-gray-300 text-stone-950 focus:ring-stone-950"
                        />
                        <label
                          htmlFor="isNew"
                          className="text-sm font-semibold text-gray-900 cursor-pointer select-none"
                        >
                          Mark as New Arrival
                        </label>
                      </div>
                      <p className="text-xs text-blue-600">
                        Product will be pushed to the top of "New Arrivals" on
                        the homepage.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Sizes
                    </label>
                    <input
                      type="text"
                      name="sizes"
                      value={formData.sizes}
                      onChange={handleChange}
                      placeholder="e.g. 40, 41, 42, 43"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Colors
                    </label>
                    <input
                      type="text"
                      name="colors"
                      value={formData.colors}
                      onChange={handleChange}
                      placeholder="e.g. Red, Blue, Obsidian Black"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Features
                    </label>
                    <textarea
                      name="features"
                      value={formData.features}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950 font-mono text-sm"
                      placeholder="- Durable Rubber Sole&#10;- Breathable Mesh Upper"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    {/* SKU & Stock */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU (Stock Keeping Unit)
                      </label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950 font-mono uppercase"
                        placeholder="NK-AIR-001"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock Quantity *
                        </label>
                        {parseInt(formData.stock) < 10 &&
                          parseInt(formData.stock) >= 0 && (
                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              Low Stock
                            </span>
                          )}
                        {parseInt(formData.stock) === 0 && (
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950"
                        placeholder="0"
                      />
                    </div>

                    {/* Pricing */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Original Price (MRP)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-2.5 text-gray-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          name="originalPrice"
                          value={formData.originalPrice}
                          onChange={handleChange}
                          className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="discount"
                          value={formData.discount}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-2.5 text-gray-400">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Selling Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-2.5 text-gray-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stone-950/10 focus:border-stone-950 font-semibold text-gray-900"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        This is the final price the customer pays.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center transition-colors hover:border-stone-950/30 bg-gray-50/50">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                      accept="image/*"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-4"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-stone-950 shadow-sm border border-gray-100">
                        <Upload size={28} />
                      </div>
                      <div>
                        <span className="text-base font-semibold text-gray-900">
                          Click to upload images
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          AVG, PNG, JPG (Max 5MB each)
                        </p>
                      </div>
                    </label>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-6">
                      {formData.images.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                            Preview
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  currentStep === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-white hover:shadow-sm"
                }`}
              >
                Back
              </button>

              <button
                type="button"
                onClick={
                  currentStep === STEPS.length ? handleSubmit : handleNext
                }
                disabled={loading}
                className="px-8 py-2.5 rounded-lg bg-stone-950 text-white font-medium hover:bg-stone-800 transition-colors shadow-lg shadow-stone-950/20 flex items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                {currentStep === STEPS.length ? (
                  isEditMode ? (
                    "Update Product"
                  ) : (
                    "Create Product"
                  )
                ) : (
                  <>
                    Next <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
