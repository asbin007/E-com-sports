import Hero from "../components/home/Hero";
import SpecialOffers from "../components/home/SpecialOffers";
import Recommendations from "../components/home/Recommendations";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Truck,
  RotateCcw,
  Headphones,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

/* ===== BRAND MARQUEE ===== */
const brands = ["Nike", "Adidas", "Puma", "Under Armour", "Asics", "New Balance", "Yonex", "Kookaburra"];

const BrandMarquee = () => (
  <section className="py-10 bg-secondary border-y border-border-primary overflow-hidden">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...brands, ...brands].map((brand, i) => (
        <span
          key={i}
          className="mx-10 text-lg font-bold text-muted/50 uppercase tracking-[0.2em] select-none hover:text-accent transition-colors cursor-default"
        >
          {brand}
        </span>
      ))}
    </div>
  </section>
);

/* ===== TRUST STRIP ===== */
const TrustStrip = () => {
  const features = [
    { icon: Shield, label: "100% Authentic", desc: "Verified products" },
    { icon: Truck, label: "Fast Delivery", desc: "Nepal wide" },
    { icon: RotateCcw, label: "7-Day Returns", desc: "Easy policy" },
    { icon: Headphones, label: "WhatsApp Support", desc: "24/7 available" },
  ];
  return (
    <section className="py-6 bg-primary border-b border-border-primary">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 group cursor-default"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <f.icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary block">{f.label}</span>
                <span className="text-[10px] text-muted">{f.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== QUICK CATEGORY PILLS ===== */
const categories = [
  { name: "Football", slug: "football", emoji: "⚽" },
  { name: "Cricket", slug: "cricket", emoji: "🏏" },
  { name: "Basketball", slug: "basketball", emoji: "🏀" },
  { name: "Running", slug: "running", emoji: "🏃" },
  { name: "Gym & Fitness", slug: "gym-fitness", emoji: "💪" },
  { name: "Outdoor", slug: "outdoor", emoji: "🏕️" },
  { name: "Accessories", slug: "accessories", emoji: "🎽" },
];

const CategoryPills = () => {
  const navigate = useNavigate();
  return (
    <section className="py-8 bg-primary">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/shop")}
            className="flex-shrink-0 px-6 py-3 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20"
          >
            All Products
          </motion.button>
          {categories.map((cat, idx) => (
            <motion.button
              key={cat.slug}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/${cat.slug}`)}
              className="flex-shrink-0 px-5 py-3 bg-secondary border border-border-primary text-primary rounded-xl text-xs font-semibold hover:border-accent hover:text-accent hover:bg-accent/5 transition-all flex items-center gap-2"
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== CTA BANNER ===== */
const CTABanner = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-inverse text-inverse relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-10"
        >
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-black text-inverse uppercase tracking-tight">
              Can't find what you{" "}
              <span className="text-accent italic">need</span>?
            </h2>
            <p className="text-inverse/50 mt-3 max-w-md text-sm leading-relaxed">
              Message us on WhatsApp and we'll help you find the perfect gear. Custom orders welcome.
            </p>
          </div>
          <div className="flex gap-4">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "9779748477628"}?text=Hi!%20I'm%20looking%20for%20specific%20sports%20gear.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#25D366] text-white rounded-2xl font-bold text-sm hover:bg-[#20bd5a] transition-all shadow-xl shadow-[#25D366]/20 flex items-center gap-2"
            >
              WhatsApp Us
              <ArrowRight className="w-4 h-4" />
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/shop")}
              className="px-8 py-4 bg-primary/10 text-inverse border border-border-primary/20 rounded-2xl font-bold text-sm hover:bg-primary/20 transition-all flex items-center gap-2"
            >
              Browse All
              <ChevronRight className="w-4 h-4" />
            </motion.button>
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
      {/* Every band below is backed by a different /recommendations collection,
          so the same eight rows can no longer masquerade as five sections. */}
      <Recommendations
        title="New Arrivals"
        subtitle="Just dropped — fresh gear from top brands"
        source="new-arrivals"
        limit={8}
      />
      <BrandMarquee />
      <Recommendations
        title="Recommended For You"
        subtitle="A mix pulled from across the store"
        source="personalized"
        limit={4}
      />
      <SpecialOffers title="Trending Now" />
      <Recommendations
        title="Best Sellers"
        subtitle="Our highest-selling gear of all time"
        source="best-sellers"
        limit={4}
      />
      <CTABanner />
    </div>
  );
};

export default Home;
