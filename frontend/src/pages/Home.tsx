import Hero from "../components/home/Hero";
import SpecialOffers from "../components/home/SpecialOffers";
import Recommendations from "../components/home/Recommendations";
import TikTokFeed from "../components/home/TikTokFeed";
import { whatsappUrl } from "../data/store";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Banknote,
  Truck,
  MapPin,
  Headphones,
  MessageCircle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

/** cubic-bezier(.2,.7,.3,1) — the one easing in the system. */
const EASE_SNAP: [number, number, number, number] = [0.2, 0.7, 0.3, 1];

/* ===== BRAND MARQUEE =====
   The brands actually on the shelf. The keyframes run at 45s in index.css. */
const brands = ["Nike", "Adidas", "Puma", "New Balance", "Hummel", "Kelme", "Anda", "Mitre"];

const BrandMarquee = () => (
  <section className="overflow-hidden border-y-2 border-border-primary bg-secondary py-8">
    <h2 className="sr-only">Brands we stock</h2>
    <div className="flex animate-marquee whitespace-nowrap">
      {[...brands, ...brands].map((brand, i) => (
        <span
          key={i}
          className="mx-8 select-none font-display text-2xl font-semibold uppercase leading-none tracking-[0.12em] text-tertiary"
        >
          {brand}
        </span>
      ))}
    </div>
  </section>
);

/* ===== TRUST STRIP =====
   Only what the shop says about itself: no returns window, no authenticity
   claim, no review count. */
const TrustStrip = () => {
  const reduce = useReducedMotion();
  const features = [
    { icon: Banknote, label: "COD available" },
    { icon: Truck, label: "Delivery all over Nepal" },
    { icon: MapPin, label: "Bardibas · Chaudhary Market" },
    { icon: Headphones, label: "WhatsApp support" },
    { icon: MessageCircle, label: "Order on WhatsApp" },
  ];
  return (
    <section className="border-b-2 border-border-primary bg-primary py-5">
      <h2 className="sr-only">Why order from us</h2>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {features.map((f, i) => (
            <motion.li
              key={f.label}
              // Mount-driven: nothing below the fold waits on an observer.
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: EASE_SNAP, delay: i * 0.04 }}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary"
            >
              <f.icon className="h-4 w-4 flex-shrink-0 text-pitch" aria-hidden="true" />
              {f.label}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
};

/* ===== QUICK CATEGORY PILLS ===== */
const categories = [
  { name: "Football Boots", slug: "football-boots" },
  { name: "Club Jerseys", slug: "club-jerseys" },
  { name: "Team Kits", slug: "team-kits" },
  { name: "Footballs", slug: "footballs" },
  { name: "Trophies & Medals", slug: "trophies-medals" },
  { name: "Training Wear", slug: "training-wear" },
  { name: "Bags", slug: "bags" },
  { name: "Accessories", slug: "accessories" },
];

const CategoryPills = () => {
  const navigate = useNavigate();
  return (
    <section className="bg-primary py-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Shop by category</p>
        <h2 className="mt-3 font-display font-semibold uppercase leading-none text-primary"
          style={{ fontSize: "clamp(34px,6vw,56px)" }}
        >
          Pick your kit
        </h2>
        <div className="scrollbar-hide mt-6 flex gap-3 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="inline-flex min-h-[44px] flex-shrink-0 items-center rounded-tag border-2 border-inverse bg-accent px-5 font-display text-base font-semibold uppercase leading-none text-white transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            All products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => navigate(`/${cat.slug}`)}
              className="inline-flex min-h-[44px] flex-shrink-0 items-center rounded-tag border-2 border-inverse bg-card px-5 font-display text-base font-semibold uppercase leading-none text-primary transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== CTA BANNER ===== */
const CTABanner = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  return (
    <section className="band py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <motion.div
          // Mount-driven: nothing below the fold waits on an observer.
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: EASE_SNAP }}
          className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end"
        >
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-inverse/70">
              Not on the shelf?
              <span aria-hidden="true" className="h-px w-12 bg-primary/30" />
            </p>
            <h2
              className="mt-3 font-display font-semibold uppercase leading-none text-inverse"
              style={{ fontSize: "clamp(34px,6vw,56px)" }}
            >
              We&apos;ll source it for you
            </h2>
            <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-inverse/70">
              Message us on WhatsApp with the club, the size or the bat grade you need.
              Custom orders welcome, cash on delivery across Nepal.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={whatsappUrl("Hi! I'm looking for specific sports gear.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-primary/30 bg-pitch px-6 font-display text-lg font-semibold uppercase leading-none text-inverse transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"
            >
              WhatsApp us
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-primary/30 bg-primary/10 px-6 font-display text-lg font-semibold uppercase leading-none text-inverse transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary/20 active:translate-x-0 active:translate-y-0"
            >
              Browse all
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ===== MAIN HOME PAGE ===== */
const Home = () => {
  return (
    <div>
      <Hero />
      <TrustStrip />
      <CategoryPills />
      <div className="rule-section" />
      {/* Every band below is backed by a different /recommendations collection,
          so the same eight rows can no longer masquerade as five sections. */}
      <Recommendations
        title="New Arrivals"
        subtitle="Just in — this week's jerseys, balls and boots"
        source="new-arrivals"
        limit={8}
      />
      <BrandMarquee />
      <Recommendations
        title="Recommended For You"
        subtitle="A mix pulled from across the shop"
        source="personalized"
        limit={4}
      />
      <div className="rule-section" />
      <SpecialOffers title="Trending Now" />
      <div className="rule-section" />
      <Recommendations
        title="Best Sellers"
        subtitle="What moves fastest off the shelf"
        source="best-sellers"
        limit={4}
      />
      <div className="rule-section" />
      <TikTokFeed />
      <div className="rule-section" />
      <CTABanner />
    </div>
  );
};

export default Home;
