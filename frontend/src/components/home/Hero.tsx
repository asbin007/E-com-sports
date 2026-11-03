import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  ChevronRight,
  MapPin,
  RefreshCw,
  Truck,
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { Product } from "../../services/productService";
import { recommendationService } from "../../services/recommendationService";
import { NO_IMAGE_PLACEHOLDER } from "../../utils/placeholder";

/** cubic-bezier(.2,.7,.3,1) — the one easing in the system. */
const EASE_SNAP: [number, number, number, number] = [0.2, 0.7, 0.3, 1];

const resolveImageUrl = (product: Product | undefined): string => {
  if (!product) return NO_IMAGE_PLACEHOLDER;
  const imgs = (product.images ?? []) as Array<unknown>;
  for (const raw of imgs) {
    if (typeof raw === "string" && raw.trim()) return raw;
    if (raw && typeof raw === "object") {
      const url = (raw as { url?: string | null }).url;
      if (url && url.trim()) return url;
    }
  }
  return NO_IMAGE_PLACEHOLDER;
};

const formatPrice = (n: number) => `Rs ${n.toLocaleString()}`;

/**
 * The trust row says only what the shop itself says — no invented returns
 * window, no "100% authentic", no review counts.
 */
const TRUST = [
  { icon: Banknote, label: "COD available" },
  { icon: Truck, label: "Delivery all over Nepal" },
  { icon: MapPin, label: "Bardibas, Chaudhary Market" },
] as const;

/**
 * Above-the-fold content must not wait on the animation: the resting state is
 * visible and the whole entrance chain is a 160ms fade with a 40ms stagger. It
 * collapses to nothing when the visitor has asked for reduced motion
 * (framer-motion's `useReducedMotion` reads `prefers-reduced-motion`).
 */
const buildContainerVariants = (reduce: boolean): Variants => ({
  hidden: { opacity: reduce ? 1 : 0 },
  visible: {
    opacity: 1,
    transition: reduce ? { duration: 0 } : { staggerChildren: 0.04 },
  },
});

const buildItemVariants = (reduce: boolean): Variants => ({
  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reduce ? 0 : 0.16, ease: EASE_SNAP },
  },
});

const PRIMARY_BUTTON =
  "inline-flex items-center gap-2 rounded-tag border-2 border-inverse bg-accent px-6 py-3 font-display text-lg font-semibold uppercase leading-none text-white transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";

const SECONDARY_BUTTON =
  "inline-flex items-center gap-2 rounded-tag border-2 border-inverse bg-card px-6 py-3 font-display text-lg font-semibold uppercase leading-none text-primary transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";

type FeaturedStatus = "loading" | "settled" | "failed";

const Hero = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Product | null>(null);
  const [status, setStatus] = useState<FeaturedStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  const prefersReducedMotion = useReducedMotion();
  const reduce = prefersReducedMotion === true;
  const containerVariants = buildContainerVariants(reduce);
  const itemVariants = buildItemVariants(reduce);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setStatus("loading");
      try {
        // The card carries a discount badge, so it is backed by the on-sale
        // collection rather than "whatever was added to the catalogue last".
        const onSale = await recommendationService.getOnSale({ limit: 1 });
        if (cancelled) return;
        setFeatured(onSale[0] ?? null);
        setStatus("settled");
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load the hero deal", err);
        setFeatured(null);
        setStatus("failed");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const featuredPrice = featured?.price ?? featured?.variants?.[0]?.price ?? 0;
  const featuredOriginal = featured?.originalPrice ?? featured?.variants?.[0]?.originalPrice ?? 0;
  const discount =
    featuredOriginal && featuredPrice && featuredOriginal > featuredPrice
      ? Math.round(((featuredOriginal - featuredPrice) / featuredOriginal) * 100)
      : 0;

  return (
    <section className="bg-primary border-b-[3px] border-inverse">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.p variants={itemVariants} className="eyebrow">
            Brothers Sports House · Kit room
          </motion.p>

          {/* The thesis statement: one oversized Teko line, no gradient, no glow. */}
          <motion.h1
            variants={itemVariants}
            className="mt-4 font-display font-bold uppercase leading-[0.92] text-primary"
            style={{ fontSize: "clamp(56px,13vw,128px)" }}
          >
            Boots, kits &amp; trophies
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-2 font-display font-semibold leading-none text-accent"
            style={{ fontSize: "clamp(24px,5vw,44px)" }}
          >
            खेलका सामान, घरसम्म
          </motion.p>

          <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* LEFT: what we stock, the trust row, the two ways in */}
            <motion.div variants={itemVariants} className="lg:col-span-7">
              <p className="max-w-[62ch] text-base leading-relaxed text-secondary">
                Football boots in UK sizes, club jerseys by season, plain team kits,
                Kelme match and training balls in sizes 3, 4 and 5, plus trophies,
                medals and bags — Nike, Adidas, Puma, New Balance, Hummel, Kelme,
                Anda and Mitre.
              </p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {TRUST.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 rounded-tag border-[1.5px] border-inverse bg-card px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary"
                  >
                    <item.icon className="h-3.5 w-3.5 text-pitch" aria-hidden="true" />
                    {item.label}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate("/shop")} className={PRIMARY_BUTTON}>
                  Shop all kit
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/football-boots")}
                  className={SECONDARY_BUTTON}
                >
                  Football boots
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>

            {/* RIGHT: today's deal, straight off /recommendations/on-sale */}
            <motion.div variants={itemVariants} className="lg:col-span-5">
              {featured ? (
                <button
                  type="button"
                  onClick={() => navigate(`/product/${featured.id}`)}
                  className="w-full overflow-hidden rounded-card border-2 border-inverse bg-card text-left transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
                >
                  <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-inverse bg-secondary">
                    <img
                      src={resolveImageUrl(featured)}
                      alt={featured.name}
                      className="h-full w-full object-cover"
                      // A dead product image must not leave a blank panel in
                      // the first screenful; fall back to the placeholder.
                      onError={(event) => {
                        const img = event.currentTarget;
                        if (img.src !== NO_IMAGE_PLACEHOLDER) img.src = NO_IMAGE_PLACEHOLDER;
                      }}
                    />
                    {discount > 0 && (
                      <span className="absolute left-3 top-3 rounded-tag border-[1.5px] border-marigold bg-marigold-soft px-2 py-1 font-display text-sm font-bold uppercase leading-none tabular-nums text-marigold">
                        -{discount}% off
                      </span>
                    )}
                    <span className="absolute right-3 top-3 rounded-tag border-[1.5px] border-inverse bg-card px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                      Top deal
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                      {featured.Brand?.name ?? "Brothers Sports House"} ·{" "}
                      {featured.Category?.name ?? "Kit"}
                    </p>
                    {/* A heading is flow content and cannot live inside a button, so the
                        product name sets the button's accessible name instead. */}
                    <span className="mt-1 block line-clamp-2 font-display text-[29px] font-semibold uppercase leading-none text-primary">
                      {featured.name}
                    </span>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-[32px] font-bold leading-none tabular-nums text-accent">
                        {formatPrice(featuredPrice)}
                      </span>
                      {featuredOriginal > featuredPrice && (
                        <span className="text-sm tabular-nums text-tertiary line-through">
                          {formatPrice(featuredOriginal)}
                        </span>
                      )}
                    </div>

                    <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                      View product
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </button>
              ) : status === "loading" ? (
                /* A flat holding panel, not an infinite pulse. */
                <div className="flex aspect-[4/5] items-end rounded-card border-2 border-border-primary bg-secondary p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                    Loading today&apos;s deal
                  </p>
                </div>
              ) : (
                /* The fetch has settled with nothing to show. Render a real panel —
                   the holding panel above must never be the resting state. */
                <div className="flex min-h-[20rem] flex-col justify-between gap-6 rounded-card border-2 border-inverse bg-card p-6">
                  <div>
                    <p className="eyebrow">
                      {status === "failed" ? "Deal unavailable" : "No offers running"}
                    </p>
                    <h2 className="mt-3 font-display text-[29px] font-semibold uppercase leading-none text-primary">
                      {status === "failed"
                        ? "Today's deal didn't load"
                        : "No deals running right now"}
                    </h2>
                    <p className="mt-2 max-w-[62ch] text-sm text-tertiary">
                      {status === "failed"
                        ? "We couldn't reach the store for this one. The full catalogue is still available."
                        : "Nothing is discounted at the moment — the full range is still worth a look."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {status === "failed" && (
                      <button
                        type="button"
                        onClick={() => setAttempt((n) => n + 1)}
                        className={PRIMARY_BUTTON}
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Try again
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate("/shop")}
                      className={SECONDARY_BUTTON}
                    >
                      Browse all kit
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
