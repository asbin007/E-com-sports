import { useState, useEffect } from "react";
import { AlertCircle, ChevronRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { productService } from "../../services/productService";
import type { Product } from "../../services/productService";
import { recommendationService } from "../../services/recommendationService";
import ProductCard from "../product/ProductCard";
import { ProductCardSkeleton } from "../ui/Skeleton";

export type RecommendationSource =
  | "new-arrivals"
  | "best-sellers"
  | "trending"
  | "on-sale"
  | "personalized";

/**
 * The skeleton and the loaded grid must share one track definition, otherwise the
 * column count snaps when data lands. `ProductGridSkeleton` in ui/Skeleton hardcodes
 * a different (xl:grid-cols-3) track, so this section lays its own skeleton row out
 * from `ProductCardSkeleton` inside this exact grid instead of using it.
 */
const PRODUCT_GRID = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8";

interface RecommendationsProps {
  title: string;
  subtitle: string;
  /** Which `/recommendations` collection backs this section. */
  source?: RecommendationSource;
  limit?: number;
  /** Only meaningful for `new-arrivals`: the recency window, in days. */
  days?: number;
  /**
   * Escape hatch for plain catalogue queries ("more from this category"), which
   * the recommendation API has no collection for. Ignored when `source` is set.
   */
  filter?: {
    limit?: number;
    categoryId?: string;
    search?: string;
  };
}

const Recommendations = ({
  title,
  subtitle,
  source,
  limit,
  days,
  filter,
}: RecommendationsProps) => {
  // Read the primitives out of `filter` so the effect below depends on values
  // rather than on an object literal's identity, which changes on every render
  // of the parent and would refetch endlessly.
  const categoryId = filter?.categoryId;
  const search = filter?.search;
  const count = limit ?? filter?.limit ?? 4;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // `/personalized` reports whether it actually used the signed-in user's history,
  // so the strapline can stop claiming to be personal when it isn't.
  const [personalNote, setPersonalNote] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFailed(false);
      try {
        let result: Product[];
        let note: string | null = null;

        switch (source) {
          case "new-arrivals":
            result = await recommendationService.getNewArrivals({ limit: count, days });
            break;
          case "best-sellers":
            result = await recommendationService.getBestSellers({ limit: count });
            break;
          case "trending":
            result = await recommendationService.getTrending({ limit: count });
            break;
          case "on-sale":
            result = await recommendationService.getOnSale({ limit: count });
            break;
          case "personalized": {
            const personalized = await recommendationService.getPersonalized({ limit: count });
            result = personalized.products;
            note = personalized.isPersonalized
              ? "Based on the categories and brands you've ordered before"
              : null;
            break;
          }
          default: {
            const catalogue = await productService.getAllProducts({
              limit: count,
              categoryId,
              search,
            });
            result = catalogue.data ?? [];
          }
        }

        if (cancelled) return;
        setProducts(result);
        setPersonalNote(note);
      } catch (err) {
        if (cancelled) return;
        console.error(`Failed to load the "${source ?? "catalogue"}" product section`, err);
        setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [source, count, days, categoryId, search, attempt]);

  const header = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
    >
      <div>
        <h2 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tight">
          {title.split(" ").map((word, i, arr) => (
            <span key={i} className={i === arr.length - 1 ? "text-accent italic" : ""}>
              {word}{" "}
            </span>
          ))}
        </h2>
        <p className="text-tertiary mt-2 text-sm">{personalNote ?? subtitle}</p>
      </div>
      <motion.button
        whileHover={{ x: 4 }}
        onClick={() => navigate("/shop")}
        className="group flex items-center gap-2 text-sm font-bold text-accent hover:text-accent-hover transition-colors"
      >
        View All
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>
    </motion.div>
  );

  if (loading) {
    return (
      <section className="py-20 bg-primary">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="h-8 w-48 bg-secondary rounded-lg animate-pulse mb-3" />
            <div className="h-4 w-64 bg-secondary rounded-lg animate-pulse" />
          </div>
          <div className={PRODUCT_GRID}>
            {Array.from({ length: count }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // A failed request is not an empty shelf — say so and offer a way out, rather
  // than silently deleting the section from the page.
  if (failed) {
    return (
      <section className="py-20 bg-primary">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {header}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border-primary bg-card px-6 py-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-primary">
                  We couldn't load this section
                </p>
                <p className="text-xs text-tertiary mt-1">
                  The store didn't respond. Everything else on this page still works.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="self-start sm:self-auto flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Genuinely nothing to show: hide the section entirely.
  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-primary">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {header}
        <div className={PRODUCT_GRID}>
          {products.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Recommendations;
