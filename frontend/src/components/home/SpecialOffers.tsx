import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { recommendationService } from "../../services/recommendationService";
import type { Product } from "../../services/productService";
import { NO_IMAGE_PLACEHOLDER, pickProductImageUrl } from "../../utils/placeholder";
import { SpecialOffersSkeleton } from "../ui/Skeleton";

/** cubic-bezier(.2,.7,.3,1) — the one easing in the system. */
const EASE_SNAP: [number, number, number, number] = [0.2, 0.7, 0.3, 1];

/** 48px square, so it clears the 44px hit-area floor. */
const CAROUSEL_BUTTON =
  "inline-flex h-12 w-12 items-center justify-center rounded-tag border-2 border-primary/30 text-inverse transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-on-accent active:translate-x-0 active:translate-y-0";

interface SpecialOffersProps {
  title?: string;
}

const SpecialOffers = ({
  title = "Trending Collections",
}: SpecialOffersProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchOffers = async () => {
      setLoading(true);
      setFailed(false);
      try {
        // Most-ordered products of the last 30 days — the carousel's own metric,
        // not just the newest rows in the catalogue.
        const trending = await recommendationService.getTrending({ limit: 5 });
        if (cancelled) return;
        setProducts(trending);
        setCurrentIdx(0);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load trending products", err);
        setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOffers();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (products.length > 0) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % products.length);
      }, 6000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [products]);

  const handleNext = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setCurrentIdx((prev) => (prev + 1) % products.length);
  };

  const handlePrev = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setCurrentIdx((prev) => (prev - 1 + products.length) % products.length);
  };

  /* The eyebrow is hand-rolled rather than `.eyebrow` because this band sits on
     ink, where the shared tertiary colour would drop below 4.5:1. */
  const eyebrow = (label: string) => (
    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-inverse/70">
      {label}
      <span aria-hidden="true" className="h-px w-12 bg-primary/30" />
    </p>
  );

  const heading = (
    <h2
      className="mt-3 font-display font-semibold uppercase leading-none text-inverse"
      style={{ fontSize: "clamp(34px,6vw,56px)" }}
    >
      {title}
    </h2>
  );

  if (loading) {
    return <SpecialOffersSkeleton />;
  }

  // The request failed — keep the section on the page and let the customer retry,
  // instead of quietly dropping a whole band out of the homepage.
  if (failed) {
    return (
      <section className="band py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {eyebrow("Most ordered, last 30 days")}
          {heading}
          <div className="mt-10 flex flex-col justify-between gap-4 rounded-card border-2 border-primary/30 px-6 py-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-display text-xl font-semibold uppercase leading-none text-inverse">
                  We couldn&apos;t load this section
                </p>
                <p className="mt-2 max-w-[62ch] text-sm text-inverse/70">
                  The store didn&apos;t respond. Everything else on this page still works.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="inline-flex min-h-[44px] flex-shrink-0 items-center gap-2 self-start rounded-tag border-2 border-primary/30 bg-accent px-5 font-display text-base font-semibold uppercase leading-none text-on-accent transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover active:translate-x-0 active:translate-y-0 sm:self-auto"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  const current = products[currentIdx];
  const currentPrice = current.price || current.variants?.[0]?.price || 0;

  return (
    <section className="band overflow-hidden py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            {eyebrow("Most ordered, last 30 days")}
            {heading}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className={CAROUSEL_BUTTON}
              aria-label="Previous product"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className={CAROUSEL_BUTTON}
              aria-label="Next product"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative md:h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: EASE_SNAP }}
              className="relative min-h-[550px] overflow-hidden rounded-card border-2 border-primary/30 md:absolute md:inset-0 md:min-h-0"
            >
              <div className="flex h-auto flex-col md:h-full md:flex-row">
                {/* Content */}
                <div className="flex w-full flex-col justify-center p-6 sm:p-8 md:w-1/2 md:p-12 lg:p-16">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                    Featured drop
                  </p>

                  <h3 className="mt-4 font-display font-semibold uppercase leading-none text-inverse"
                    style={{ fontSize: "clamp(29px,5vw,48px)" }}
                  >
                    {current.name}
                  </h3>

                  <p className="mt-4 line-clamp-2 max-w-[62ch] text-sm leading-relaxed text-inverse/70">
                    {current.description ||
                      "Match kit from the shelf in Chaudhary Market, Bardibas."}
                  </p>

                  <p className="mt-6">
                    <span className="inline-block rounded-tag border-2 border-primary/30 bg-accent px-5 py-2 font-display text-3xl font-bold leading-none tabular-nums text-on-accent">
                      Rs {currentPrice.toLocaleString()}
                    </span>
                  </p>

                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/product/${current.id}`)}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-primary/30 bg-primary px-6 font-display text-lg font-semibold uppercase leading-none text-primary transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent hover:text-on-accent active:translate-x-0 active:translate-y-0"
                    >
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                      View product
                    </button>
                  </div>
                </div>

                {/* Image */}
                <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-t-2 border-primary/30 p-8 sm:aspect-[16/9] md:aspect-auto md:h-full md:w-1/2 md:border-l-2 md:border-t-0">
                  <img
                    src={
                      current.images && current.images.length > 0
                        ? pickProductImageUrl(current.images)
                        : NO_IMAGE_PLACEHOLDER
                    }
                    alt={current.name}
                    className="relative z-10 h-full w-full object-contain"
                  />

                  <span className="absolute right-6 top-6 z-20 rounded-tag border-[1.5px] border-primary/30 bg-inverse px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-inverse">
                    {current.ProductType?.name || current.Category?.name || "Kit"}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="mt-4 flex justify-center">
          {products.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center"
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={idx === currentIdx}
            >
              <span
                className={`block h-2 rounded-tag transition duration-snap ease-snap ${
                  idx === currentIdx ? "w-8 bg-accent" : "w-2 bg-primary/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;
