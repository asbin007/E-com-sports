import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ShoppingBag,
  X,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import { productService, type Product } from "../services/productService";
import {
  categoryService,
  brandService,
  productTypeService,
  type Category,
  type Brand,
  type ProductType,
} from "../services/filterService";
import { cn } from "../utils/cn";
import { getImageUrl } from "../utils/imageUrl";

const ProductListing = () => {
  const { category: urlCategory } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter Options from Backend
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // Filter States (using IDs)
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedProductTypeIds, setSelectedProductTypeIds] = useState<
    string[]
  >([]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesData, brandsData, productTypesData] =
          await Promise.all([
            categoryService.getAllCategories(),
            brandService.getAllBrands(),
            productTypeService.getAllProductTypes(),
          ]);
        setCategories(categoriesData);
        setBrands(brandsData);
        setProductTypes(productTypesData);
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Initial setup from URL
  useEffect(() => {
    if (urlCategory && categories.length > 0) {
      const formatted =
        urlCategory.charAt(0).toUpperCase() +
        urlCategory.slice(1).replace(/-/g, " ");
      const matchedCategory = categories.find(
        (c) => c.name.toLowerCase() === formatted.toLowerCase(),
      );
      if (matchedCategory) {
        setSelectedCategoryIds([matchedCategory.id]);
      }
    } else {
      setSelectedCategoryIds([]);
    }
  }, [urlCategory, categories]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {
          search: search || undefined,
          categoryId:
            selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : undefined,
          brandId:
            selectedBrandIds.length > 0 ? selectedBrandIds[0] : undefined,
          productTypeId:
            selectedProductTypeIds.length > 0
              ? selectedProductTypeIds[0]
              : undefined,
        };

        const response = await productService.getAllProducts(params);
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [selectedCategoryIds, selectedBrandIds, selectedProductTypeIds, search]);

  const toggleFilter = (
    list: string[],
    setList: (v: string[]) => void,
    item: string,
  ) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item],
    );
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-3xl font-black text-stone-950 uppercase tracking-tighter italic mb-2">
              {urlCategory ? urlCategory.replace(/-/g, " ") : "All Collections"}
              <span className="text-orange-600 ml-2">({products.length})</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Link to="/" className="hover:text-orange-600 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-stone-900 capitalize">Shop</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-orange-600 transition-colors" />
              <input
                type="text"
                placeholder="Find your greatness..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all text-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-6 py-3 bg-stone-950 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-10 sticky top-32 h-[calc(100vh-160px)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-orange-600/20">
            {/* Categories (Sport Types) */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-950 flex items-center justify-between">
                Sport Types
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() =>
                      toggleFilter(
                        selectedCategoryIds,
                        setSelectedCategoryIds,
                        category.id,
                      )
                    }
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                        selectedCategoryIds.includes(category.id)
                          ? "bg-orange-600 border-orange-600"
                          : "border-gray-200 group-hover:border-orange-600",
                      )}
                    >
                      {selectedCategoryIds.includes(category.id) && (
                        <LayoutGrid className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold transition-colors",
                        selectedCategoryIds.includes(category.id)
                          ? "text-stone-950"
                          : "text-gray-500 group-hover:text-stone-950",
                      )}
                    >
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="space-y-4 border-t border-gray-100 pt-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-950">
                Brands
              </h3>
              <div className="space-y-2">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() =>
                      toggleFilter(
                        selectedBrandIds,
                        setSelectedBrandIds,
                        brand.id,
                      )
                    }
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                        selectedBrandIds.includes(brand.id)
                          ? "bg-stone-950 border-stone-950"
                          : "border-gray-200 group-hover:border-stone-950",
                      )}
                    >
                      {selectedBrandIds.includes(brand.id) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold transition-colors",
                        selectedBrandIds.includes(brand.id)
                          ? "text-stone-950"
                          : "text-gray-500 group-hover:text-stone-950",
                      )}
                    >
                      {brand.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Types */}
            <div className="space-y-4 border-t border-gray-100 pt-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-950">
                Product Type
              </h3>
              <div className="space-y-2">
                {productTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() =>
                      toggleFilter(
                        selectedProductTypeIds,
                        setSelectedProductTypeIds,
                        type.id,
                      )
                    }
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                        selectedProductTypeIds.includes(type.id)
                          ? "bg-stone-950 border-stone-950"
                          : "border-gray-200 group-hover:border-stone-950",
                      )}
                    >
                      {selectedProductTypeIds.includes(type.id) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold transition-colors",
                        selectedProductTypeIds.includes(type.id)
                          ? "text-stone-950"
                          : "text-gray-500 group-hover:text-stone-950",
                      )}
                    >
                      {type.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Active Filters Bar */}
            {(selectedCategoryIds.length > 0 ||
              selectedBrandIds.length > 0 ||
              selectedProductTypeIds.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-8 items-center">
                <span className="text-xs font-black uppercase tracking-tighter text-gray-400 mr-2">
                  Active:
                </span>
                {selectedCategoryIds.map((id) => {
                  const category = categories.find((c) => c.id === id);
                  return category ? (
                    <button
                      key={id}
                      onClick={() =>
                        toggleFilter(
                          selectedCategoryIds,
                          setSelectedCategoryIds,
                          id,
                        )
                      }
                      className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-orange-600 hover:text-white transition-all border border-transparent"
                    >
                      {category.name}
                      <X className="w-3 h-3" />
                    </button>
                  ) : null;
                })}
                {selectedBrandIds.map((id) => {
                  const brand = brands.find((b) => b.id === id);
                  return brand ? (
                    <button
                      key={id}
                      onClick={() =>
                        toggleFilter(selectedBrandIds, setSelectedBrandIds, id)
                      }
                      className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-orange-600 hover:text-white transition-all border border-transparent"
                    >
                      {brand.name}
                      <X className="w-3 h-3" />
                    </button>
                  ) : null;
                })}
                {selectedProductTypeIds.map((id) => {
                  const type = productTypes.find((t) => t.id === id);
                  return type ? (
                    <button
                      key={id}
                      onClick={() =>
                        toggleFilter(
                          selectedProductTypeIds,
                          setSelectedProductTypeIds,
                          id,
                        )
                      }
                      className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-orange-600 hover:text-white transition-all border border-transparent"
                    >
                      {type.name}
                      <X className="w-3 h-3" />
                    </button>
                  ) : null;
                })}
                <button
                  onClick={() => {
                    setSelectedCategoryIds([]);
                    setSelectedBrandIds([]);
                    setSelectedProductTypeIds([]);
                  }}
                  className="text-xs font-bold text-orange-600 hover:underline ml-4"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <div className="flex flex-col justify-center items-center h-[50vh] gap-4">
                <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin" />
                <p className="text-sm font-black uppercase tracking-widest text-stone-950">
                  Analyzing the drop...
                </p>
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200"
              >
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full" />
                  <ShoppingBag className="w-16 h-16 text-stone-950 relative" />
                </div>
                <h3 className="text-2xl font-black text-stone-950 uppercase tracking-tighter italic">
                  Nothing in the vault
                </h3>
                <p className="text-gray-500 mt-2 font-medium max-w-xs mx-auto">
                  Your search didn't match any of our elite picks. Try adjusting
                  your filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategoryIds([]);
                    setSelectedBrandIds([]);
                    setSelectedProductTypeIds([]);
                    setSearch("");
                  }}
                  className="mt-8 px-8 py-3 bg-stone-950 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95"
                >
                  Reset Equipment
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-8 gap-y-12">
                <AnimatePresence mode="popLayout">
                  {products.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group cursor-pointer"
                    >
                      <Link to={`/product/${product.id}`}>
                        <div className="relative aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden mb-6 border border-gray-100 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                          {product.ProductImages && product.ProductImages.length > 0 ? (
                            <img
                              src={
                                product.ProductImages.find(img => img.isThumbnail)?.url || 
                                product.ProductImages[0].url
                              }
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-black tracking-widest italic uppercase">
                              No Image
                            </div>
                          )}

                          {/* Badge */}
                          <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                              {product.ProductType?.name || "Training"}
                              {product.ProductType?.name || "Training"}
                            </span>
                          </div>

                          {/* New Arrival Badge */}
                          {product.isNew && (
                            <div className="absolute top-4 right-4">
                              <span className="bg-stone-950 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                                New Arrival
                              </span>
                            </div>
                          )}

                          {/* Discount Badge */}
                          {product.discount && product.discount > 0 && (
                            <div className="absolute bottom-4 left-4 z-10">
                              <span className="bg-red-600 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                {product.discount}% OFF
                              </span>
                            </div>
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                          <div className="absolute bottom-6 left-6 right-6 translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 hover:bg-orange-700">
                              Quick Add
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">
                              {product.Brand?.name || "Premium Gear"}
                            </p>
                            <div className="flex flex-col items-end">
                              {(product.originalPrice ||
                                product.Variants?.[0]?.originalPrice) &&
                                (product.originalPrice ||
                                  product.Variants?.[0]?.originalPrice ||
                                  0) >
                                  (product.price ||
                                    product.Variants?.[0]?.price ||
                                    0) && (
                                  <span className="text-xs text-gray-400 line-through font-medium">
                                    Rs{" "}
                                    {(
                                      product.originalPrice ||
                                      product.Variants?.[0]?.originalPrice ||
                                      0
                                    ).toLocaleString()}
                                  </span>
                                )}
                              <p className="text-sm font-black text-stone-950 italic">
                                Rs{" "}
                                {(
                                  product.price ||
                                  product.Variants?.[0]?.price ||
                                  0
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <h3 className="text-lg font-black text-stone-950 uppercase tracking-tighter italic line-clamp-1 group-hover:text-orange-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium line-clamp-1">
                            {product.Category?.name || "Athletic Collection"}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer Overlay */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] bg-white z-[70] p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                  Equipment <span className="text-orange-600">Filters</span>
                </h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-12">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">
                    Sport Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() =>
                          toggleFilter(
                            selectedCategoryIds,
                            setSelectedCategoryIds,
                            category.id,
                          )
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                          selectedCategoryIds.includes(category.id)
                            ? "bg-orange-600 border-orange-600 text-white"
                            : "border-gray-100 text-gray-500",
                        )}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">
                    Brands
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() =>
                          toggleFilter(
                            selectedBrandIds,
                            setSelectedBrandIds,
                            brand.id,
                          )
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                          selectedBrandIds.includes(brand.id)
                            ? "bg-stone-950 border-stone-950 text-white"
                            : "border-gray-100 text-gray-500",
                        )}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">
                    Product Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {productTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() =>
                          toggleFilter(
                            selectedProductTypeIds,
                            setSelectedProductTypeIds,
                            type.id,
                          )
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                          selectedProductTypeIds.includes(type.id)
                            ? "bg-stone-950 border-stone-950 text-white"
                            : "border-gray-100 text-gray-500",
                        )}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 sticky bottom-0 bg-white pt-4 pb-8 border-t border-gray-100">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-5 bg-stone-950 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  View {products.length} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductListing;
