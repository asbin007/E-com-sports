import { useState, useEffect } from "react";
import { AlertCircle, ChevronRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { productService } from "../../services/productService";
import type { Product } from "../../services/productService";
import { recommendationService } from "../../services/recommendationService";
import ProductCard from "../product/ProductCard";
import { ProductCardSkeleton } from "../ui/Skeleton";

/** cubic-bezier(.2,.7,.3,1) — the one easing in the system. */
const EASE_SNAP: [number, number, number, number] = [0.2, 0.7, 0.3, 1];

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
  const reduce = useReducedMotion();

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

  /** Eyebrow + Teko heading, the one section-header shape in the system. */
  const header = (
    <motion.div
      // Mount-driven: a header below the fold must never wait on an observer.
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: EASE_SNAP }}
      className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
    >
      <div>
        <p className="eyebrow">{personalNote ?? subtitle}</p>
        <h2
          className="mt-3 font-display font-semibold uppercase leading-none text-primary"
          style={{ fontSize: "clamp(34px,6vw,56px)" }}
        >
          {title}
        </h2>
      </div>
      <button
        type="button"
        onClick={() => navigate("/shop")}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-card px-5 font-display text-base font-semibold uppercase leading-none text-primary transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
      >
        View all
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  );

  if (loading) {
    return (
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {/* Flat holding bars, not an infinite pulse. */}
          <div className="mb-10">
            <div className="h-3 w-48 bg-secondary" />
            <div className="mt-4 h-10 w-72 bg-secondary" />
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
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {header}
          <div className="flex flex-col justify-between gap-4 rounded-card border-2 border-inverse bg-card px-6 py-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-display text-xl font-semibold uppercase leading-none text-primary">
                  We couldn&apos;t load this section
                </p>
                <p className="mt-2 max-w-[62ch] text-sm text-tertiary">
                  The store didn&apos;t respond. Everything else on this page still works.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="inline-flex min-h-[44px] flex-shrink-0 items-center gap-2 self-start rounded-tag border-2 border-inverse bg-accent px-5 font-display text-base font-semibold uppercase leading-none text-on-accent transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none sm:self-auto"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
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
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
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
