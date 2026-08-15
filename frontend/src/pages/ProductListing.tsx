import { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ShoppingBag,
  X,
  ChevronDown,
  Loader2,
  Grid3X3,
  List,
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
import ProductBadges from "../components/product/ProductBadges";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import { pickProductImageUrl, NO_IMAGE_PLACEHOLDER } from "../utils/placeholder";

// Matches the backend default in getAllProducts (limit = 20).
const PAGE_SIZE = 20;

/** A product is sold out when every sellable variant has no stock left. */
const isSoldOut = (product: Product): boolean => {
  const variants = product.variants;
  if (!variants || variants.length === 0) return false;
  const sellable = variants.filter((v) => v.isActive !== false);
  if (sellable.length === 0) return true;
  return sellable.every((v) => (v.stock ?? 0) <= 0);
};

/** Thumbnail first, then any usable image, then the inline placeholder. */
const getProductImageUrl = (product: Product): string => {
  const images = product.images;
  if (!images || images.length === 0) return NO_IMAGE_PLACEHOLDER;
  const thumbnail = images.find(
    (img) => typeof img === "object" && img !== null && img.isThumbnail
  );
  return pickProductImageUrl(thumbnail ? [thumbnail, ...images] : images);
};

const ProductListing = () => {
  const { category: urlCategory } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter Options from Backend
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // Filter States — single-select: the backend matches one id per field.
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    () => searchParams.get("category") || ""
  );
  const [selectedBrandId, setSelectedBrandId] = useState(
    () => searchParams.get("brand") || ""
  );
  const [selectedProductTypeId, setSelectedProductTypeId] = useState(
    () => searchParams.get("type") || ""
  );

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesData, brandsData, productTypesData] = await Promise.all([
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

  // Route param (/shop/:category) wins over the query string, but only while it
  // is present — otherwise it would wipe a category restored from the URL.
  const previousUrlCategory = useRef<string | undefined>(urlCategory);
  useEffect(() => {
    if (urlCategory) {
      if (categories.length > 0) {
        const formatted =
          urlCategory.charAt(0).toUpperCase() +
          urlCategory.slice(1).replace(/-/g, " ");
        const matchedCategory = categories.find(
          (c) => c.name.toLowerCase() === formatted.toLowerCase()
        );
        if (matchedCategory) {
          setSelectedCategoryId(matchedCategory.id);
        }
      }
    } else if (previousUrlCategory.current) {
      setSelectedCategoryId("");
    }
    previousUrlCategory.current = urlCategory;
  }, [urlCategory, categories]);

  // State -> URL, so a filtered result set survives a refresh, the back button
  // and being pasted into Viber / WhatsApp.
  useEffect(() => {
    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (selectedCategoryId) next.set("category", selectedCategoryId);
    if (selectedBrandId) next.set("brand", selectedBrandId);
    if (selectedProductTypeId) next.set("type", selectedProductTypeId);
    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategoryId, selectedBrandId, selectedProductTypeId, searchParams]);

  // URL -> state, for navigations from outside the page (e.g. the navbar search).
  // No-ops when the values already match, so it never fights the writer above.
  useEffect(() => {
    setSearch((prev) => {
      const next = searchParams.get("q") || "";
      return prev.trim() === next ? prev : next;
    });
    setSelectedCategoryId((prev) => {
      const next = searchParams.get("category") || "";
      return prev === next ? prev : next;
    });
    setSelectedBrandId((prev) => {
      const next = searchParams.get("brand") || "";
      return prev === next ? prev : next;
    });
    setSelectedProductTypeId((prev) => {
      const next = searchParams.get("type") || "";
      return prev === next ? prev : next;
    });
  }, [searchParams]);

  // Any filter or search change restarts paging from the first page.
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategoryId, selectedBrandId, selectedProductTypeId]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const response = await productService.getAllProducts({
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          categoryId: selectedCategoryId || undefined,
          brandId: selectedBrandId || undefined,
          productTypeId: selectedProductTypeId || undefined,
        });
        if (cancelled) return;
        // Browse grid: later pages append to the list, they do not replace it.
        setProducts((prev) =>
          page === 1 ? response.data : [...prev, ...response.data]
        );
        setTotal(response.pagination?.total ?? response.data.length);
      } catch (error) {
        if (!cancelled) console.error("Failed to fetch products", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    const timer = setTimeout(fetchProducts, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedCategoryId, selectedBrandId, selectedProductTypeId, search, page]);

  const toggleFilter = (
    current: string,
    setValue: (v: string) => void,
    item: string
  ) => {
    setValue(current === item ? "" : item);
  };

  const clearAllFilters = () => {
    setSelectedCategoryId("");
    setSelectedBrandId("");
    setSelectedProductTypeId("");
  };

  const activeFilterCount = [
    selectedCategoryId,
    selectedBrandId,
    selectedProductTypeId,
  ].filter(Boolean).length;

  const hasMore = products.length < total;

  return (
    <div className="min-h-screen bg-primary pt-4 pb-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-8 gap-6 border-b border-border-primary">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-primary uppercase tracking-tight">
              {urlCategory ? urlCategory.replace(/-/g, " ") : "All Products"}
              <span className="text-accent ml-2 text-xl">({total})</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-tertiary mt-1">
              <Link to="/" className="hover:text-accent transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-primary capitalize font-medium">
                {urlCategory ? urlCategory.replace(/-/g, " ") : "Shop"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition-all placeholder:text-muted"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="hidden sm:flex items-center bg-secondary rounded-xl border border-border-primary p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "grid"
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-primary"
                )}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "list"
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-primary"
                )}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-inverse text-inverse rounded-xl font-bold text-xs uppercase tracking-wider relative"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-8 mt-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-8 sticky top-28 h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin">
            {/* Categories */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                Sport Categories
                <ChevronDown className="w-3.5 h-3.5" />
              </h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                      selectedCategoryId === category.id
                        ? "bg-accent/10 border border-accent/20"
                        : "hover:bg-surface-hover"
                    )}
                    onClick={() =>
                      toggleFilter(selectedCategoryId, setSelectedCategoryId, category.id)
                    }
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0",
                        selectedCategoryId === category.id
                          ? "bg-accent border-accent"
                          : "border-border-primary"
                      )}
                    >
                      {selectedCategoryId === category.id && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        selectedCategoryId === category.id
                          ? "text-primary font-semibold"
                          : "text-secondary"
                      )}
                    >
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="space-y-3 border-t border-border-primary pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Brands
              </h3>
              <div className="space-y-1">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                      selectedBrandId === brand.id
                        ? "bg-accent/10 border border-accent/20"
                        : "hover:bg-surface-hover"
                    )}
                    onClick={() =>
                      toggleFilter(selectedBrandId, setSelectedBrandId, brand.id)
                    }
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0",
                        selectedBrandId === brand.id
                          ? "bg-accent border-accent"
                          : "border-border-primary"
                      )}
                    >
                      {selectedBrandId === brand.id && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        selectedBrandId === brand.id
                          ? "text-primary font-semibold"
                          : "text-secondary"
                      )}
                    >
                      {brand.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Types */}
            <div className="space-y-3 border-t border-border-primary pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Product Type
              </h3>
              <div className="space-y-1">
                {productTypes.map((type) => (
                  <div
                    key={type.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                      selectedProductTypeId === type.id
                        ? "bg-accent/10 border border-accent/20"
                        : "hover:bg-surface-hover"
                    )}
                    onClick={() =>
                      toggleFilter(
                        selectedProductTypeId,
                        setSelectedProductTypeId,
                        type.id
                      )
                    }
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0",
                        selectedProductTypeId === type.id
                          ? "bg-accent border-accent"
                          : "border-border-primary"
                      )}
                    >
                      {selectedProductTypeId === type.id && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        selectedProductTypeId === type.id
                          ? "text-primary font-semibold"
                          : "text-secondary"
                      )}
                    >
                      {type.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="w-full py-2.5 text-sm font-bold text-accent hover:bg-accent/10 rounded-xl transition-colors"
              >
                Clear All Filters ({activeFilterCount})
              </button>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Active Filters Bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1">
                  Active:
                </span>
                {(() => {
                  const category = categories.find((c) => c.id === selectedCategoryId);
                  return category ? (
                    <button
                      onClick={() =>
                        toggleFilter(
                          selectedCategoryId,
                          setSelectedCategoryId,
                          category.id
                        )
                      }
                      className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-accent/20 transition-all border border-accent/20"
                    >
                      {category.name}
                      <X className="w-3 h-3" />
                    </button>
                  ) : null;
                })()}
                {(() => {
                  const brand = brands.find((b) => b.id === selectedBrandId);
                  return brand ? (
                    <button
                      onClick={() =>
                        toggleFilter(selectedBrandId, setSelectedBrandId, brand.id)
                      }
                      className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-accent/20 transition-all border border-accent/20"
                    >
                      {brand.name}
                      <X className="w-3 h-3" />
                    </button>
                  ) : null;
                })()}
                {(() => {
                  const type = productTypes.find((t) => t.id === selectedProductTypeId);
                  return type ? (
                    <button
                      onClick={() =>
                        toggleFilter(
                          selectedProductTypeId,
                          setSelectedProductTypeId,
                          type.id
                        )
                      }
                      className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-accent/20 transition-all border border-accent/20"
                    >
                      {type.name}
                      <X className="w-3 h-3" />
                    </button>
                  ) : null;
                })()}
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 bg-secondary rounded-2xl border border-border-primary"
              >
                <ShoppingBag className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-bold text-primary">No products found</h3>
                <p className="text-tertiary mt-2 max-w-sm mx-auto">
                  Try adjusting your filters or search to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    clearAllFilters();
                    setSearch("");
                  }}
                  className="mt-6 px-6 py-2.5 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent-hover transition-all active:scale-95"
                >
                  Clear Filters
                </button>
              </motion.div>
            ) : (
              <>
                <div
                  className={cn(
                    "gap-6",
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                      : "flex flex-col"
                  )}
                >
                  <AnimatePresence mode="popLayout">
                    {products.map((product, idx) => {
                      const soldOut = isSoldOut(product);
                      return (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: (idx % PAGE_SIZE) * 0.03 }}
                          className={cn(
                            "group cursor-pointer",
                            viewMode === "list" &&
                              "flex gap-6 p-4 bg-card rounded-2xl border border-border-primary hover:shadow-lg transition-all"
                          )}
                        >
                          {/* Image (its own link, so the CTA below is not nested in it) */}
                          <div
                            className={cn(
                              "relative",
                              viewMode === "grid" ? "mb-4" : "flex-shrink-0"
                            )}
                          >
                            <Link to={`/product/${product.id}`} className="block">
                              <div
                                className={cn(
                                  "relative overflow-hidden bg-secondary rounded-2xl border border-border-primary group-hover:shadow-lg group-hover:border-accent/20 transition-all duration-300",
                                  viewMode === "grid"
                                    ? "aspect-[4/5]"
                                    : "w-32 h-32"
                                )}
                              >
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={getProductImageUrl(product)}
                                    alt={product.name}
                                    loading="lazy"
                                    onError={(e) => {
                                      const img = e.currentTarget;
                                      if (img.src !== NO_IMAGE_PLACEHOLDER) {
                                        img.onerror = null;
                                        img.src = NO_IMAGE_PLACEHOLDER;
                                      }
                                    }}
                                    className={cn(
                                      "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                                      soldOut && "opacity-40 grayscale"
                                    )}
                                  />
                                ) : (
                                  <div
                                    className={cn(
                                      "w-full h-full flex items-center justify-center text-muted",
                                      soldOut && "opacity-40"
                                    )}
                                  >
                                    <ShoppingBag className="w-8 h-8" />
                                  </div>
                                )}

                                {/* Badge */}
                                {viewMode === "grid" && (
                                  <div className="absolute top-3 left-3">
                                    <span className="bg-card/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-primary border border-border-primary">
                                      {product.ProductType?.name ||
                                        product.Category?.name ||
                                        "Sport"}
                                    </span>
                                  </div>
                                )}

                                {/* Status badges (discount / featured / new) */}
                                <div className="absolute top-3 right-3 z-10">
                                  <ProductBadges product={product} layout="stack" />
                                </div>

                                {/* Out of stock */}
                                {soldOut && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-tertiary border border-border-primary">
                                      Out of stock
                                    </span>
                                  </div>
                                )}
                              </div>
                            </Link>

                            {/* Quick View on hover (grid only) */}
                            {viewMode === "grid" && !soldOut && (
                              <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <Link
                                  to={`/product/${product.id}`}
                                  className="block w-full py-3 text-center bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-accent/30 hover:bg-accent-hover transition-colors active:scale-95"
                                >
                                  Quick View
                                </Link>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <Link
                            to={`/product/${product.id}`}
                            className={cn(
                              "block space-y-1",
                              viewMode === "list" && "flex-1 py-2"
                            )}
                          >
                            <p className="text-[10px] font-bold text-accent uppercase tracking-wider">
                              {product.Brand?.name || "Premium Gear"}
                            </p>
                            <h3 className="font-bold text-primary text-sm line-clamp-1 group-hover:text-accent transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-xs text-tertiary line-clamp-1">
                              {product.Category?.name || "Athletic Collection"}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <p className="text-base font-black text-primary">
                                Rs{" "}
                                {(
                                  product.price ||
                                  product.variants?.[0]?.price ||
                                  0
                                ).toLocaleString()}
                              </p>
                              {(product.originalPrice ||
                                product.variants?.[0]?.originalPrice) &&
                                (product.originalPrice ||
                                  product.variants?.[0]?.originalPrice ||
                                  0) >
                                  (product.price || product.variants?.[0]?.price || 0) && (
                                  <span className="text-xs text-muted line-through">
                                    Rs{" "}
                                    {(
                                      product.originalPrice ||
                                      product.variants?.[0]?.originalPrice ||
                                      0
                                    ).toLocaleString()}
                                  </span>
                                )}
                              {soldOut && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary">
                                  Sold out
                                </span>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Load More */}
                <div className="flex flex-col items-center gap-3 mt-10">
                  <p className="text-xs text-tertiary">
                    Showing {products.length} of {total}
                  </p>
                  {hasMore && (
                    <button
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-8 py-3 bg-card border border-border-primary text-primary rounded-xl font-bold text-xs uppercase tracking-wider hover:border-accent hover:text-accent transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading
                        </>
                      ) : (
                        "Load More"
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-primary z-[70] p-6 overflow-y-auto border-l border-border-primary"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-primary">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-surface-hover rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-primary" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Categories */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                    Sport Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() =>
                          toggleFilter(
                            selectedCategoryId,
                            setSelectedCategoryId,
                            category.id
                          )
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                          selectedCategoryId === category.id
                            ? "bg-accent border-accent text-white"
                            : "border-border-primary text-secondary hover:border-accent/50"
                        )}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div className="space-y-3 border-t border-border-primary pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                    Brands
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() =>
                          toggleFilter(selectedBrandId, setSelectedBrandId, brand.id)
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                          selectedBrandId === brand.id
                            ? "bg-accent border-accent text-white"
                            : "border-border-primary text-secondary hover:border-accent/50"
                        )}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Types */}
                <div className="space-y-3 border-t border-border-primary pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                    Product Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {productTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() =>
                          toggleFilter(
                            selectedProductTypeId,
                            setSelectedProductTypeId,
                            type.id
                          )
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                          selectedProductTypeId === type.id
                            ? "bg-accent border-accent text-white"
                            : "border-border-primary text-secondary hover:border-accent/50"
                        )}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="sticky bottom-0 bg-primary pt-4 pb-6 mt-8 border-t border-border-primary">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-3.5 bg-accent text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  Show {total} Results
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
