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
import { cn } from "../utils/cn";

const SPORTS = [
  "Football",
  "Cricket",
  "Basketball",
  "Running",
  "Gym & Fitness",
  "Outdoor",
];
const BRANDS = ["Nike", "Adidas", "Puma", "New Balance", "Under Armour"];
const CATEGORIES = ["Men", "Women", "Kids", "Accessories"];

const ProductListing = () => {
  const { category: urlCategory } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter States
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Initial setup from URL
  useEffect(() => {
    if (urlCategory) {
      const formatted =
        urlCategory.charAt(0).toUpperCase() +
        urlCategory.slice(1).replace(/-/g, " ");
      if (SPORTS.includes(formatted)) setSelectedSports([formatted]);
      else if (CATEGORIES.includes(formatted))
        setSelectedCategories([formatted]);
    } else {
      setSelectedSports([]);
      setSelectedCategories([]);
    }
  }, [urlCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {
          search: search || undefined,
          sportType: selectedSports.length > 0 ? selectedSports[0] : undefined,
          brandName: selectedBrands.length > 0 ? selectedBrands[0] : undefined,
        };

        if (!params.sportType && urlCategory) {
          const formatted = urlCategory.replace(/-/g, " ");
          const sportMatch = SPORTS.find(
            (s) => s.toLowerCase() === formatted.toLowerCase(),
          );
          if (sportMatch) {
            params.sportType = sportMatch;
          }
        }

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
  }, [selectedSports, selectedBrands, selectedCategories, search, urlCategory]);

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
            {/* Sport Types */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-950 flex items-center justify-between">
                Disciplines
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </h3>
              <div className="space-y-2">
                {SPORTS.map((sport) => (
                  <div
                    key={sport}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() =>
                      toggleFilter(selectedSports, setSelectedSports, sport)
                    }
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                        selectedSports.includes(sport)
                          ? "bg-orange-600 border-orange-600"
                          : "border-gray-200 group-hover:border-orange-600",
                      )}
                    >
                      {selectedSports.includes(sport) && (
                        <LayoutGrid className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold transition-colors",
                        selectedSports.includes(sport)
                          ? "text-stone-950"
                          : "text-gray-500 group-hover:text-stone-950",
                      )}
                    >
                      {sport}
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
                {BRANDS.map((brand) => (
                  <div
                    key={brand}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() =>
                      toggleFilter(selectedBrands, setSelectedBrands, brand)
                    }
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                        selectedBrands.includes(brand)
                          ? "bg-stone-950 border-stone-950"
                          : "border-gray-200 group-hover:border-stone-950",
                      )}
                    >
                      {selectedBrands.includes(brand) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold transition-colors",
                        selectedBrands.includes(brand)
                          ? "text-stone-950"
                          : "text-gray-500 group-hover:text-stone-950",
                      )}
                    >
                      {brand}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-4 border-t border-gray-100 pt-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-950">
                Category
              </h3>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() =>
                      toggleFilter(
                        selectedCategories,
                        setSelectedCategories,
                        cat,
                      )
                    }
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                        selectedCategories.includes(cat)
                          ? "bg-stone-950 border-stone-950"
                          : "border-gray-200 group-hover:border-stone-950",
                      )}
                    >
                      {selectedCategories.includes(cat) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold transition-colors",
                        selectedCategories.includes(cat)
                          ? "text-stone-950"
                          : "text-gray-500 group-hover:text-stone-950",
                      )}
                    >
                      {cat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Active Filters Bar */}
            {(selectedSports.length > 0 ||
              selectedBrands.length > 0 ||
              selectedCategories.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-8 items-center">
                <span className="text-xs font-black uppercase tracking-tighter text-gray-400 mr-2">
                  Active:
                </span>
                {[
                  ...selectedSports,
                  ...selectedBrands,
                  ...selectedCategories,
                ].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      if (selectedSports.includes(filter))
                        toggleFilter(selectedSports, setSelectedSports, filter);
                      else if (selectedBrands.includes(filter))
                        toggleFilter(selectedBrands, setSelectedBrands, filter);
                      else
                        toggleFilter(
                          selectedCategories,
                          setSelectedCategories,
                          filter,
                        );
                    }}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-orange-600 hover:text-white transition-all border border-transparent"
                  >
                    {filter}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSelectedSports([]);
                    setSelectedBrands([]);
                    setSelectedCategories([]);
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
                    setSelectedSports([]);
                    setSelectedBrands([]);
                    setSelectedCategories([]);
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
                          {product.ProductImages?.[0] ? (
                            <img
                              src={product.ProductImages[0].url}
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
                              {product.sportType || "Training"}
                            </span>
                          </div>

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
                            <p className="text-sm font-black text-stone-950 italic">
                              Rs {product.price || "5,999"}
                            </p>
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
                    Disciplines
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SPORTS.map((sport) => (
                      <button
                        key={sport}
                        onClick={() =>
                          toggleFilter(selectedSports, setSelectedSports, sport)
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                          selectedSports.includes(sport)
                            ? "bg-orange-600 border-orange-600 text-white"
                            : "border-gray-100 text-gray-500",
                        )}
                      >
                        {sport}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">
                    Brands
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {BRANDS.map((brand) => (
                      <button
                        key={brand}
                        onClick={() =>
                          toggleFilter(selectedBrands, setSelectedBrands, brand)
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                          selectedBrands.includes(brand)
                            ? "bg-stone-950 border-stone-950 text-white"
                            : "border-gray-100 text-gray-500",
                        )}
                      >
                        {brand}
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
