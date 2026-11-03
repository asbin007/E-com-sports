import { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ShoppingBag,
  X,
  Loader2,
  Grid3X3,
  List,
} from "lucide-react";
import { isProductSoldOut, productService, type Product } from "../services/productService";
import {
  categoryService,
  brandService,
  productTypeService,
  type Category,
  type Brand,
  type ProductType,
} from "../services/filterService";
import { cn } from "../utils/cn";
import ProductCard from "../components/product/ProductCard";
import ProductBadges from "../components/product/ProductBadges";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import { pickProductImageUrl, NO_IMAGE_PLACEHOLDER } from "../utils/placeholder";

// Matches the backend default in getAllProducts (limit = 20).
const PAGE_SIZE = 20;

/** Reveal: 160ms, 12px of travel, visible at rest. */
const REVEAL = { duration: 0.16, ease: [0.2, 0.7, 0.3, 1] } as const;

/** A filter row is an interactive target, so it holds the 44px floor. */
const FILTER_ROW =
  "flex w-full min-h-[44px] items-center gap-3 rounded-tag px-3 py-2 text-left transition duration-snap ease-snap";

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

  /** One removable chip per active filter; nothing when that filter is unset. */
  const renderActiveChip = (
    option: { id: string; name: string } | undefined,
    current: string,
    set: (v: string) => void
  ) =>
    option ? (
      <button
        type="button"
        onClick={() => toggleFilter(current, set, option.id)}
        className="flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-card px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-primary transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
      >
        {option.name}
        <X aria-hidden="true" className="h-3 w-3" />
        <span className="sr-only">Remove this filter</span>
      </button>
    ) : null;

  /** One filter group, rendered the same way in the sidebar and the drawer. */
  const renderFilterGroup = (
    label: string,
    options: Array<{ id: string; name: string }>,
    selectedId: string,
    setSelectedId: (v: string) => void
  ) => (
    <div className="space-y-2">
      <h3 className="eyebrow">{label}</h3>
      <div className="space-y-1">
        {options.map((option) => {
          const isActive = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => toggleFilter(selectedId, setSelectedId, option.id)}
              className={cn(
                FILTER_ROW,
                isActive ? "bg-marigold-soft" : "hover:bg-surface-hover"
              )}
            >
              {/* A square ink box, not a radio pill — and the fill is not the
                  only signal: the label goes bold with it. */}
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-tag border-2 transition duration-snap ease-snap",
                  isActive ? "border-inverse bg-inverse" : "border-border-primary"
                )}
              />
              <span
                className={cn(
                  "text-sm",
                  isActive ? "font-bold text-primary" : "text-secondary"
                )}
              >
                {option.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-primary pb-12 pt-4">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-6 border-b-[3px] border-inverse py-8 md:flex-row md:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-tertiary">
              <Link to="/" className="transition-colors duration-snap ease-snap hover:text-accent">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span className="font-bold capitalize text-primary">
                {urlCategory ? urlCategory.replace(/-/g, " ") : "Shop"}
              </span>
            </div>
            <h1 className="mt-1 font-display text-[clamp(34px,6vw,56px)] font-semibold uppercase leading-[0.92] text-primary">
              {urlCategory ? urlCategory.replace(/-/g, " ") : "All products"}
              <span className="ml-3 align-middle font-display text-[clamp(20px,3vw,30px)] tabular-nums text-accent">
                {total}
              </span>
            </h1>
          </div>

          <div className="flex w-full items-center gap-3 md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-72">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary"
              />
              <input
                type="text"
                aria-label="Search products"
                placeholder="Search jerseys, boots, bats..."
                className="min-h-[44px] w-full rounded-tag border-2 border-inverse bg-card pl-10 pr-3 text-sm text-primary outline-none transition duration-snap ease-snap placeholder:text-tertiary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="hidden items-center gap-1 sm:flex">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-tag border-2 transition duration-snap ease-snap",
                  viewMode === "grid"
                    ? "border-inverse bg-inverse text-inverse"
                    : "border-inverse bg-card text-primary hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
                )}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-tag border-2 transition duration-snap ease-snap",
                  viewMode === "list"
                    ? "border-inverse bg-inverse text-inverse"
                    : "border-inverse bg-card text-primary hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-inverse px-4 font-display text-[19px] font-semibold uppercase leading-none text-inverse transition duration-snap ease-snap lg:hidden"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-tag bg-accent px-1.5 py-0.5 text-[11px] font-bold tabular-nums leading-none text-inverse">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="scrollbar-thin sticky top-28 hidden h-[calc(100vh-140px)] w-64 flex-shrink-0 space-y-6 overflow-y-auto pr-4 lg:block">
            {renderFilterGroup(
              "Sport categories",
              categories,
              selectedCategoryId,
              setSelectedCategoryId
            )}
            <div className="border-t-2 border-border-primary pt-6">
              {renderFilterGroup("Brands", brands, selectedBrandId, setSelectedBrandId)}
            </div>
            <div className="border-t-2 border-border-primary pt-6">
              {renderFilterGroup(
                "Product type",
                productTypes,
                selectedProductTypeId,
                setSelectedProductTypeId
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="min-h-[44px] w-full rounded-tag border-2 border-inverse bg-card font-display text-[19px] font-semibold uppercase leading-none text-primary transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
              >
                Clear filters
                <span className="ml-1.5 tabular-nums">({activeFilterCount})</span>
              </button>
            )}
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            {/* Active Filters Bar */}
            {activeFilterCount > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                  Active
                </span>
                {renderActiveChip(
                  categories.find((c) => c.id === selectedCategoryId),
                  selectedCategoryId,
                  setSelectedCategoryId
                )}
                {renderActiveChip(
                  brands.find((b) => b.id === selectedBrandId),
                  selectedBrandId,
                  setSelectedBrandId
                )}
                {renderActiveChip(
                  productTypes.find((t) => t.id === selectedProductTypeId),
                  selectedProductTypeId,
                  setSelectedProductTypeId
                )}
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={REVEAL}
                className="rounded-card border-2 border-inverse bg-card px-6 py-20 text-center"
              >
                <ShoppingBag aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-tertiary" />
                <h2 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
                  Nothing on this shelf
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-tertiary">
                  Try another sport, brand or size — or ask us on WhatsApp and we will
                  check the back room.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setSearch("");
                  }}
                  className="mt-6 min-h-[44px] rounded-tag border-2 border-inverse bg-accent px-6 font-display text-[19px] font-semibold uppercase leading-none text-inverse transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
                >
                  Clear filters
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
                      const soldOut = isProductSoldOut(product.variants);

                      // Grid uses the shared product card, so the size run and
                      // the chips read identically everywhere in the shop.
                      if (viewMode === "grid") {
                        return (
                          <motion.div key={product.id} layout exit={{ opacity: 0 }}>
                            <ProductCard product={product} index={idx % PAGE_SIZE} />
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={product.id}
                          layout
                          // Opacity only: animating `y` leaves framer's inline
                          // transform on the row, which would override the
                          // Tailwind hover lift in the class list below.
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ ...REVEAL, delay: (idx % PAGE_SIZE) * 0.04 }}
                          className="group flex gap-4 rounded-card border-2 border-inverse bg-card p-3 transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
                        >
                          {/* Image (its own link, so the CTA below is not nested in it) */}
                          <Link
                            to={`/product/${product.id}`}
                            className="block flex-shrink-0"
                          >
                            <div className="relative h-32 w-32 overflow-hidden rounded-tag border-2 border-inverse bg-secondary">
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
                                    "h-full w-full object-cover",
                                    soldOut && "opacity-50 grayscale"
                                  )}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    "flex h-full w-full items-center justify-center text-tertiary",
                                    soldOut && "opacity-50"
                                  )}
                                >
                                  <ShoppingBag aria-hidden="true" className="h-7 w-7" />
                                </div>
                              )}

                              {soldOut && (
                                <span className="absolute inset-x-0 bottom-0 bg-inverse px-1 py-0.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-inverse">
                                  Sold out
                                </span>
                              )}
                            </div>
                          </Link>

                          {/* Info */}
                          <Link
                            to={`/product/${product.id}`}
                            className="block min-w-0 flex-1 py-1"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                                {product.Brand?.name ||
                                  product.Category?.name ||
                                  "Kit room"}
                              </p>
                              <ProductBadges product={product} layout="row" />
                            </div>
                            <h3 className="line-clamp-1 font-display text-[29px] font-semibold uppercase leading-[0.92] text-primary">
                              {product.name}
                            </h3>
                            <p className="line-clamp-1 text-sm text-tertiary">
                              {product.ProductType?.name || product.Category?.name || ""}
                            </p>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="font-display text-[23px] font-semibold leading-none tabular-nums text-primary">
                                Rs{" "}
                                {(
                                  product.price ||
                                  product.variants?.[0]?.price ||
                                  0
                                ).toLocaleString()}
                              </span>
                              {(product.originalPrice ||
                                product.variants?.[0]?.originalPrice) &&
                                (product.originalPrice ||
                                  product.variants?.[0]?.originalPrice ||
                                  0) >
                                  (product.price || product.variants?.[0]?.price || 0) && (
                                  <span className="font-display text-[17px] leading-none tabular-nums text-muted line-through">
                                    Rs{" "}
                                    {(
                                      product.originalPrice ||
                                      product.variants?.[0]?.originalPrice ||
                                      0
                                    ).toLocaleString()}
                                  </span>
                                )}
                              {soldOut && (
                                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
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
                <div className="mt-10 flex flex-col items-center gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                    Showing <span className="tabular-nums">{products.length}</span> of{" "}
                    <span className="tabular-nums">{total}</span>
                  </p>
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={loadingMore}
                      className="flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-card px-8 font-display text-[19px] font-semibold uppercase leading-none text-primary transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard disabled:translate-x-0 disabled:translate-y-0 disabled:border-border-primary disabled:bg-secondary disabled:text-muted disabled:shadow-none"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                          Loading
                        </>
                      ) : (
                        "Load more"
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
              transition={{ duration: 0.12 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 z-[60] bg-inverse/60"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.12, ease: [0.2, 0.7, 0.3, 1] }}
              className="fixed bottom-0 right-0 top-0 z-[70] w-[85%] max-w-sm overflow-y-auto border-l-2 border-inverse bg-primary p-6"
            >
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  aria-label="Close filters"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-tag border-2 border-inverse bg-card text-primary transition duration-snap ease-snap"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {renderFilterGroup(
                  "Sport categories",
                  categories,
                  selectedCategoryId,
                  setSelectedCategoryId
                )}
                <div className="border-t-2 border-border-primary pt-6">
                  {renderFilterGroup(
                    "Brands",
                    brands,
                    selectedBrandId,
                    setSelectedBrandId
                  )}
                </div>
                <div className="border-t-2 border-border-primary pt-6">
                  {renderFilterGroup(
                    "Product types",
                    productTypes,
                    selectedProductTypeId,
                    setSelectedProductTypeId
                  )}
                </div>
              </div>

              {/* Apply Button */}
              <div className="sticky bottom-0 mt-8 border-t-2 border-inverse bg-primary pb-6 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="min-h-[44px] w-full rounded-tag border-2 border-inverse bg-accent font-display text-[19px] font-semibold uppercase leading-none text-inverse transition duration-snap ease-snap hover:bg-accent-hover"
                >
                  Show <span className="tabular-nums">{total}</span> results
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
