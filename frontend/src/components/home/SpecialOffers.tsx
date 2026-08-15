import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Star,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { recommendationService } from "../../services/recommendationService";
import type { Product } from "../../services/productService";
import { NO_IMAGE_PLACEHOLDER, pickProductImageUrl } from "../../utils/placeholder";
import { SpecialOffersSkeleton } from "../ui/Skeleton";

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

  const heading = title.split(" ").map((word, i, arr) => (
    <span key={i} className={i === arr.length - 1 ? "text-accent italic" : ""}>
      {word}{" "}
    </span>
  ));

  if (loading) {
    return <SpecialOffersSkeleton />;
  }

  // The request failed — keep the section on the page and let the customer retry,
  // instead of quietly dropping a whole band out of the homepage.
  if (failed) {
    return (
      <section className="py-20 bg-inverse text-inverse">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-black text-inverse uppercase tracking-tight mb-8">
            {heading}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border-primary/20 bg-primary/5 px-6 py-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-inverse">
                  We couldn't load this section
                </p>
                <p className="text-xs text-inverse/50 mt-1">
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

  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-inverse text-inverse overflow-hidden relative">
      {/* Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-inverse uppercase tracking-tight">
              {heading}
            </h2>
            <p className="text-inverse/50 mt-2">
              Most wanted gear and high-performance drops of the season.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              className="w-12 h-12 bg-primary/5 border border-border-primary/20 rounded-xl flex items-center justify-center text-inverse hover:bg-accent hover:border-accent hover:text-white transition-all active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-12 h-12 bg-primary/5 border border-border-primary/20 rounded-xl flex items-center justify-center text-inverse hover:bg-accent hover:border-accent hover:text-white transition-all active:scale-95"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative md:h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative min-h-[550px] md:min-h-0 md:absolute md:inset-0 bg-primary/5 backdrop-blur-sm rounded-3xl border border-border-primary/20 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row h-auto md:h-full">
                {/* Content */}
                <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-6 text-accent font-bold text-xs uppercase tracking-wider">
                    <Zap className="w-4 h-4 fill-current" />
                    Featured Drop
                  </div>

                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-inverse leading-tight uppercase tracking-tight">
                    {products[currentIdx].name}
                  </h3>

                  <p className="text-inverse/50 mt-4 line-clamp-2 leading-relaxed">
                    {products[currentIdx].description ||
                      "Premium quality sports gear engineered for peak performance."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 sm:mt-8">
                    <div className="bg-accent text-white px-6 py-3 rounded-xl font-black text-xl">
                      Rs.{" "}
                      {(
                        products[currentIdx].price ||
                        products[currentIdx].variants?.[0]?.price ||
                        0
                      ).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 sm:mt-8">
                    <button
                      onClick={() =>
                        navigate(`/product/${products[currentIdx].id}`)
                      }
                      className="bg-primary text-primary px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-accent hover:text-white transition-all active:scale-95 flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      View Product
                    </button>
                  </div>
                </div>

                {/* Image */}
                <div className="w-full md:w-1/2 relative bg-primary/5 flex items-center justify-center p-8 overflow-hidden aspect-[4/3] sm:aspect-[16/9] md:aspect-auto md:h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent"></div>

                  <motion.img
                    initial={{ scale: 0.9, rotate: 5 }}
                    animate={{ scale: 1.05, rotate: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    src={
                      products[currentIdx]?.images &&
                      products[currentIdx].images.length > 0
                        ? pickProductImageUrl(products[currentIdx].images)
                        : NO_IMAGE_PLACEHOLDER
                    }
                    alt={products[currentIdx].name}
                    className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
                  />

                  <div className="absolute top-6 right-6 z-20">
                    <span className="bg-inverse/50 backdrop-blur-md px-4 py-2 rounded-full border border-border-primary/20 font-bold text-xs text-inverse uppercase tracking-wider">
                      {products[currentIdx].ProductType?.name ||
                        products[currentIdx].Category?.name ||
                        "Sport"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center mt-4">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className="group min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={idx === currentIdx}
            >
              <span
                className={`block h-2 transition-all duration-300 rounded-full ${
                  idx === currentIdx
                    ? "w-8 bg-accent"
                    : "w-2 bg-primary/20 group-hover:bg-primary/40"
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
