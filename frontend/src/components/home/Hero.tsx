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
import { getCutoutUrl } from "../../utils/imageUrl";

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
 * "Kick-off sweep": the floodlight comes up, one pass of light crosses the
 * headline, and the headline lines rise out from under a mask so the type is
 * cut by a line rather than faded in. Everything animates transform and
 * opacity only, plays once, and never loops.
 *
 * Each element takes its own delay through framer-motion's `custom` prop
 * instead of a blanket stagger, because the chain is not evenly spaced. Every
 * delay below is in seconds and matches the validated timing.
 *
 * When the visitor has asked for reduced motion the whole chain collapses to
 * the resting state with no transition — the content is never withheld.
 */
const buildContainerVariants = (reduce: boolean): Variants => ({
  hidden: { opacity: reduce ? 1 : 0 },
  visible: { opacity: 1, transition: { duration: reduce ? 0 : 0.2 } },
});

/** Fades up 12px. `custom` is the delay in seconds. */
const buildItemVariants = (reduce: boolean): Variants => ({
  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 12 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: reduce ? 0 : 0.3, delay: reduce ? 0 : delay, ease: EASE_SNAP },
  }),
});

/** A headline line sliding up inside an `overflow-hidden` wrapper. */
const buildLineVariants = (reduce: boolean): Variants => ({
  hidden: { y: reduce ? "0%" : "110%" },
  visible: (delay = 0) => ({
    y: "0%",
    transition: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : delay, ease: EASE_SNAP },
  }),
});

/** The accent rule under the Nepali line draws out from the left. */
const buildRuleVariants = (reduce: boolean): Variants => ({
  hidden: { scaleX: reduce ? 1 : 0 },
  visible: {
    scaleX: 1,
    transition: { duration: reduce ? 0 : 0.36, delay: reduce ? 0 : 0.34, ease: EASE_SNAP },
  },
});

/** Today's deal settles in rather than sliding: 18px rise plus a 0.97 scale. */
const buildCardVariants = (reduce: boolean): Variants => ({
  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 18, scale: reduce ? 1 : 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : 0.3, ease: EASE_SNAP },
  },
});

const PRIMARY_BUTTON =
  "inline-flex items-center gap-2 rounded-tag border-2 border-inverse bg-accent px-6 py-3 font-display text-lg font-semibold uppercase leading-none text-on-accent transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";

const SECONDARY_BUTTON =
  "inline-flex items-center gap-2 rounded-tag border-2 border-white/60 bg-transparent px-6 py-3 font-display text-lg font-semibold uppercase leading-none text-white transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";

type FeaturedStatus = "loading" | "settled" | "failed";

const Hero = () => {
  const navigate = useNavigate();
  // A short rotation of deals rather than one fixed product: the hero is the
  // shop window, and a window that shows the same boot every visit stops being
  // looked at. It does NOT auto-advance — an infinite carousel is banned by
  // the design system and costs more attention than it earns. A visitor gets a
  // different one each load, and can step through them by hand.
  const [deals, setDeals] = useState<Product[]>([]);
  const [dealIndex, setDealIndex] = useState(0);
  const [status, setStatus] = useState<FeaturedStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const featured = deals[dealIndex] ?? null;

  const prefersReducedMotion = useReducedMotion();
  const reduce = prefersReducedMotion === true;
  const containerVariants = buildContainerVariants(reduce);
  const itemVariants = buildItemVariants(reduce);
  const lineVariants = buildLineVariants(reduce);
  const ruleVariants = buildRuleVariants(reduce);
  const cardVariants = buildCardVariants(reduce);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setStatus("loading");
      try {
        // The card carries a discount badge, so it is backed by the on-sale
        // collection rather than "whatever was added to the catalogue last".
        const onSale = await recommendationService.getOnSale({ limit: 6 });
        if (cancelled) return;
        const withImages = onSale.filter((p) => (p.images ?? []).length > 0);
        setDeals(withImages);
        setDealIndex(withImages.length ? Math.floor(Math.random() * withImages.length) : 0);
        setStatus("settled");
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load the hero deal", err);
        setDeals([]);
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
    <section className="relative overflow-hidden border-b-[3px] border-inverse bg-[linear-gradient(115deg,rgb(14_26_46)_0%,rgb(27_47_77)_100%)]">
      {/* The floodlight. Two soft pools, drawn from the theme tokens so it
          tints paper as well as the dark ground, and brought up on opacity
          alone — no blur filter, no repaint per frame. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(44% 52% at 72% 48%, rgba(120,170,255,0.20) 0%, transparent 70%)," +
            "radial-gradient(900px 420px at 12% 0%, rgba(190,13,42,0.16) 0%, transparent 62%)",
        }}
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.62, ease: EASE_SNAP }}
      />

      {/* One pass of light across the headline, then it is gone for the rest
          of the session. Nothing here loops. */}
      {!reduce && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(100deg, transparent 38%, rgba(255,255,255,0.10) 50%, transparent 62%)",
          }}
          initial={{ x: "-100%", opacity: 1 }}
          animate={{ x: "100%", opacity: 0 }}
          transition={{
            x: { duration: 0.82, delay: 0.22, ease: "linear" },
            opacity: { duration: 0.16, delay: 1.04 },
          }}
        />
      )}

      <div className="relative z-[2] mx-auto max-w-[1440px] px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-x-12 gap-y-10 lg:grid-cols-12 lg:items-start"
        >
          {/* LEFT: the headline and both ways in. The deal card used to sit
              below all of this, which left the top-right third of the screen
              empty and pushed the card under the fold. Both columns now start
              at the top. */}
          <div className="lg:col-span-7">
          <motion.p variants={itemVariants} custom={0.06} className="eyebrow !text-[#9FB0C8] after:!bg-white/20">
            Brothers Sports House · Kit room
          </motion.p>

          {/* The thesis statement: one oversized Teko line, no gradient, no
              glow. Each line sits in its own clipping wrapper so it can rise
              out from under the line above it. */}
          <h1
            className="mt-4 font-display font-bold uppercase leading-[0.9] text-white"
            style={{ fontSize: "clamp(48px,7.4vw,92px)" }}
          >
            <span className="block overflow-hidden">
              <motion.span variants={lineVariants} custom={0.12} className="block">
                Boots, kits
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span variants={lineVariants} custom={0.19} className="block">
                &amp; trophies
              </motion.span>
            </span>
          </h1>

          <motion.p
            variants={itemVariants}
            custom={0.3}
            className="mt-2 font-display font-semibold leading-none text-[#FF8E9C]"
            style={{ fontSize: "clamp(22px,3.2vw,38px)" }}
          >
            खेलका सामान, घरसम्म
          </motion.p>

          <motion.div
            aria-hidden="true"
            variants={ruleVariants}
            className="mt-3 h-[3px] w-[min(340px,70%)] origin-left bg-[#FF8E9C]"
          />

          <motion.div variants={itemVariants} custom={0.38} className="mt-7">
              <p className="max-w-[56ch] text-base leading-relaxed text-[#C6D0E0]">
                Football boots in UK sizes, club jerseys by season, plain team kits,
                Kelme match and training balls in sizes 3, 4 and 5, plus trophies,
                medals and bags — Nike, Adidas, Puma, New Balance, Hummel, Kelme,
                Anda and Mitre.
              </p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {TRUST.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 rounded-tag border border-white/25 bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#DCE6F5] backdrop-blur-[2px]"
                  >
                    <item.icon className="h-3.5 w-3.5 text-[#8FD0A6]" aria-hidden="true" />
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
          </div>

          {/* RIGHT: today's deal, straight off /recommendations/on-sale. It
              sits level with the headline so the first screenful carries both
              the shop's claim and something to buy. */}
          <motion.div variants={cardVariants} className="lg:col-span-5">
              {featured ? (
                <>
                {/* The product itself, cut out and standing on the band — no
                    card around it. A card inside a dark band is a box inside a
                    box; the cut-out is what every reference we looked at does. */}
                <button
                  type="button"
                  onClick={() => navigate(`/product/${featured.id}`)}
                  className="group relative block w-full text-left"
                  aria-label={`${featured.name} — ${formatPrice(featuredPrice)}`}
                >
                  <div className="relative grid min-h-[clamp(260px,40vh,400px)] place-items-center">
                    {/* the pool of light the product stands in */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-6 left-1/2 h-7 w-[62%] -translate-x-1/2 rounded-[50%]"
                      style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(5,10,20,.55), rgba(5,10,20,0) 70%)" }}
                    />
                    <img
                      key={featured.id}
                      src={getCutoutUrl(resolveImageUrl(featured), 700) ?? resolveImageUrl(featured)}
                      alt=""
                      className="relative h-[clamp(230px,34vh,340px)] w-auto max-w-full -rotate-[8deg] object-contain transition-transform duration-[260ms] ease-snap will-change-transform group-hover:-rotate-[4deg] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:scale-100"
                      style={{ filter: "drop-shadow(0 30px 34px rgba(4,10,20,.55))" }}
                      onError={(event) => {
                        const img = event.currentTarget;
                        if (img.src !== NO_IMAGE_PLACEHOLDER) img.src = NO_IMAGE_PLACEHOLDER;
                      }}
                    />
                    {discount > 0 && (
                      <span className="absolute left-0 top-2 rounded-tag border-[1.5px] border-white/70 bg-white px-2 py-1 font-display text-sm font-bold uppercase leading-none tabular-nums text-accent">
                        -{discount}% off
                      </span>
                    )}
                    <span className="absolute right-0 top-2 rounded-tag border border-white/30 bg-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#DCE6F5] backdrop-blur-[2px]">
                      Top deal
                    </span>
                  </div>

                  <div className="mt-2 border-t border-white/15 pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9FB0C8]">
                      {featured.Brand?.name ?? "Brothers Sports House"} ·{" "}
                      {featured.Category?.name ?? "Kit"}
                    </p>
                    <span className="mt-1 block line-clamp-2 font-display text-[27px] font-semibold uppercase leading-none text-white">
                      {featured.name}
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-[30px] font-bold leading-none tabular-nums text-[#FF8E9C]">
                        {formatPrice(featuredPrice)}
                      </span>
                      {featuredOriginal > featuredPrice && (
                        <span className="text-sm tabular-nums text-[#9FB0C8] line-through">
                          {formatPrice(featuredOriginal)}
                        </span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                        View product
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </button>

                {deals.length > 1 && (
                  <div className="mt-4 flex items-center gap-2">
                    {deals.map((deal, i) => (
                      <button
                        key={deal.id}
                        type="button"
                        onClick={() => setDealIndex(i)}
                        aria-label={`Show ${deal.name}`}
                        aria-current={i === dealIndex}
                        className={`h-8 min-w-8 rounded-tag border px-2 font-display text-sm leading-none transition duration-snap ease-snap ${
                          i === dealIndex
                            ? "border-white bg-white text-[#0E1A2E]"
                            : "border-white/30 bg-white/5 text-[#9FB0C8] hover:border-white/60 hover:text-white"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <span className="ml-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9FB0C8]">
                      {deals.length} deals today
                    </span>
                  </div>
                )}
                </>
              ) : status === "loading" ? (
                /* A flat holding panel, not an infinite pulse. */
                <div className="flex aspect-[4/5] items-end rounded-card border border-white/20 bg-white/5 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9FB0C8]">
                    Loading today&apos;s deal
                  </p>
                </div>
              ) : (
                /* The fetch has settled with nothing to show. Render a real panel —
                   the holding panel above must never be the resting state. */
                <div className="flex min-h-[20rem] flex-col justify-between gap-6 rounded-card border border-white/20 bg-white/5 p-6">
                  <div>
                    <p className="eyebrow">
                      {status === "failed" ? "Deal unavailable" : "No offers running"}
                    </p>
                    <h2 className="mt-3 font-display text-[29px] font-semibold uppercase leading-none text-white">
                      {status === "failed"
                        ? "Today's deal didn't load"
                        : "No deals running right now"}
                    </h2>
                    <p className="mt-2 max-w-[62ch] text-sm text-[#C6D0E0]">
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
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
