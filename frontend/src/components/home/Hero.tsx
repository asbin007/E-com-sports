import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Star,
  Zap,
  PackageCheck,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { Product } from "../../services/productService";
import { recommendationService } from "../../services/recommendationService";
import { NO_IMAGE_PLACEHOLDER } from "../../utils/placeholder";

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
 * Above-the-fold content must not wait on the animation. The whole entrance
 * chain is kept under 0.3s, and collapses to nothing when the visitor has asked
 * for reduced motion (framer-motion's `useReducedMotion` reads the same
 * `prefers-reduced-motion` query — no extra helper needed).
 */
const buildContainerVariants = (reduce: boolean): Variants => ({
  hidden: { opacity: reduce ? 1 : 0 },
  visible: {
    opacity: 1,
    transition: reduce
      ? { duration: 0 }
      : { staggerChildren: 0.05, delayChildren: 0.03 },
  },
});

const buildItemVariants = (reduce: boolean): Variants => ({
  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 16 },
  visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.3 } },
});

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
  /** Delay helper — every entrance delay in this section flows through it. */
  const stagger = (index: number) => (reduce ? 0 : 0.1 + index * 0.04);

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
    <section className="relative overflow-hidden bg-primary border-b border-border-primary">
      {/* Decorative Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent/8 blur-[150px]" />
        <div className="absolute -bottom-40 -right-32 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 md:pt-20 md:pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-12 gap-12 items-center"
        >
          {/* LEFT: Headline + CTAs */}
          <motion.div variants={itemVariants} className="lg:col-span-7">
            {/* Eyebrow Badge */}
            <motion.div
              initial={{ opacity: reduce ? 1 : 0, x: reduce ? 0 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reduce ? 0 : 0.08, duration: reduce ? 0 : 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-wider mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Nepal&apos;s #1 Sports Gear Destination
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-black text-primary leading-[1.05] tracking-tight">
              Gear up for the{" "}
              <span className="relative inline-block">
                <span className="text-accent">play</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 14"
                  className="absolute -bottom-1 left-0 w-full h-3 text-accent/40"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 8 C 50 2, 110 12, 198 4"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              of your life.
            </h1>

            {/* Description */}
            <p className="mt-6 text-base sm:text-lg text-secondary max-w-xl leading-relaxed">
              Authentic football boots, cricket bats, running shoes & training
              gear from Nike, Adidas, Puma, Kookaburra and more — delivered
              across Nepal.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/shop")}
                className="group px-7 py-4 bg-accent text-white rounded-2xl font-bold text-sm inline-flex items-center gap-2 hover:bg-accent-hover transition-all shadow-xl shadow-accent/25"
              >
                Shop All Products
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/cricket")}
                className="px-7 py-4 bg-secondary border border-border-primary text-primary rounded-2xl font-bold text-sm inline-flex items-center gap-2 hover:border-accent/40 hover:text-accent transition-all"
              >
                <Zap className="w-4 h-4 text-accent" />
                Cricket Season Picks
              </motion.button>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
              {[
                { icon: ShieldCheck, label: "100% Authentic", desc: "Verified products" },
                { icon: Truck, label: "Fast Delivery", desc: "All over Nepal" },
                { icon: PackageCheck, label: "7-Day Returns", desc: "Easy policy" },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stagger(idx), duration: reduce ? 0 : 0.3 }}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-border-primary bg-secondary/50 p-4 hover:border-accent/30 hover:bg-accent/5 transition-all group cursor-default"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <item.icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-primary leading-tight block">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-muted">{item.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Brand Logos */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.2em] text-muted/70 font-semibold">
              <span className="text-tertiary">Trusted brands —</span>
              {["Nike", "Adidas", "Puma", "Asics", "Kookaburra", "Yonex"].map((b) => (
                <span key={b} className="hover:text-accent transition-colors cursor-default">
                  {b}
                </span>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: Featured Product Showcase */}
          <motion.div variants={itemVariants} className="lg:col-span-5">
            {featured ? (
              <motion.button
                type="button"
                onClick={() => navigate(`/product/${featured.id}`)}
                whileHover={reduce ? undefined : { y: -4 }}
                className="group relative w-full text-left rounded-3xl overflow-hidden border border-border-primary bg-card shadow-2xl shadow-black/8 hover:shadow-accent/15 hover:border-accent/20 transition-all duration-500"
              >
                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-5 left-5 z-10 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-bold shadow-lg shadow-accent/30">
                    -{discount}% OFF
                  </div>
                )}

                {/* Collection Tag — this card is backed by /recommendations/on-sale */}
                <div className="absolute top-5 right-5 z-10 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3 h-3 fill-current" />
                  Top Deal
                </div>

                {/* Product Image */}
                <div className="relative aspect-[5/4] bg-secondary overflow-hidden">
                  <motion.img
                    src={resolveImageUrl(featured)}
                    alt={featured.name}
                    className="w-full h-full object-cover"
                    whileHover={reduce ? undefined : { scale: 1.05 }}
                    transition={{ duration: reduce ? 0 : 0.6 }}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-card via-card/50 to-transparent" />
                </div>

                {/* Product Info */}
                <div className="relative p-6 pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
                    {featured.Brand?.name ?? "Featured"} · {featured.Category?.name ?? "Sports"}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-primary leading-snug line-clamp-2">
                    {featured.name}
                  </h3>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-primary">
                        {formatPrice(featuredPrice)}
                      </span>
                      {featuredOriginal > featuredPrice && (
                        <span className="text-sm text-muted line-through">
                          {formatPrice(featuredOriginal)}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/10 text-accent text-xs font-bold group-hover:bg-accent group-hover:text-white transition-all">
                      View
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </motion.button>
            ) : status === "loading" ? (
              <div className="rounded-3xl border border-border-primary bg-secondary/30 aspect-[5/4] animate-pulse" />
            ) : (
              /* The fetch has settled with nothing to show. Render a real panel —
                 the placeholder above must never be the resting state, or it
                 pulses forever in the first screen the customer sees. */
              <div className="rounded-3xl border border-border-primary bg-card min-h-[20rem] p-8 flex flex-col justify-between gap-6">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                  {status === "failed" ? (
                    <RefreshCw className="w-6 h-6 text-accent" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-accent" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary leading-snug">
                    {status === "failed"
                      ? "Today's deal didn't load"
                      : "No deals running right now"}
                  </h3>
                  <p className="text-sm text-tertiary mt-2 max-w-sm">
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
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try again
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate("/shop")}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary border border-border-primary text-primary text-xs font-bold uppercase tracking-wider hover:border-accent/40 hover:text-accent transition-colors active:scale-95"
                  >
                    Browse all products
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="mt-5 grid grid-cols-2 gap-4">
              {[
                { icon: Star, label: "Authentic", value: "100%", sublabel: "Genuine products" },
                { icon: Truck, label: "Delivery", value: "2-4 days", sublabel: "Across Nepal" },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stagger(idx + 1), duration: reduce ? 0 : 0.3 }}
                  className="rounded-2xl border border-border-primary bg-secondary/40 p-4 flex items-center gap-3 hover:border-accent/20 hover:bg-accent/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-tertiary font-medium">
                      {stat.label}
                    </p>
                    <p className="text-sm font-bold text-primary">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
