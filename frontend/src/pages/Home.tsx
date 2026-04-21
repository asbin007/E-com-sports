import Hero from "../components/home/Hero";
import SpecialOffers from "../components/home/SpecialOffers";
import Recommendations from "../components/home/Recommendations";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Trophy,
  Dumbbell,
  Mountain,
  Component,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const categories = [
  {
    name: "Football",
    icon: Activity,
    color: "from-green-400 to-emerald-600",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800",
  },
  {
    name: "Cricket",
    icon: Trophy,
    color: "from-blue-400 to-indigo-600",
    image:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800",
  },
  {
    name: "Basketball",
    icon: Activity,
    color: "from-orange-400 to-red-600",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800",
  },
  {
    name: "Gym & Fitness",
    icon: Dumbbell,
    color: "from-rose-400 to-pink-600",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800",
  },
  {
    name: "Outdoor",
    icon: Mountain,
    color: "from-teal-400 to-cyan-600",
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800",
  },
  {
    name: "Accessories",
    icon: Component,
    color: "from-gray-400 to-slate-600",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800",
  },
];

const CategoryGrid = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-stone-950 uppercase tracking-tighter italic">
              Elite <span className="text-orange-600">Categories</span>
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Gear specialized for your discipline
            </p>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="text-[10px] font-black text-stone-950 uppercase tracking-widest border-b-2 border-orange-600 pb-1 hover:text-orange-600 transition-colors"
          >
            View All Sports
          </button>
        </div>

        {/* Compact Horizontal Scroll Row */}
        <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() =>
                navigate(
                  `/${cat.name.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`,
                )
              }
              className="flex-shrink-0 group cursor-pointer"
            >
              <div className="w-24 sm:w-32 space-y-4">
                {/* Circular Preview */}
                <div className="relative aspect-square rounded-full overflow-hidden border-2 border-transparent group-hover:border-orange-600 transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:scale-105">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-transparent transition-colors" />
                  
                  {/* Small Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg">
                      <cat.icon className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className="text-center">
                  <h3 className="text-[11px] font-black text-stone-950 uppercase tracking-widest group-hover:text-orange-600 transition-colors italic">
                    {cat.name}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  return (
    <div className="bg-stone-950">
      <Hero />
      <CategoryGrid />
      <SpecialOffers title="Trending Collections" />
      <Recommendations
        title="New Arrivals"
        subtitle="Fresh drops from your favorite brands"
        filter={{ limit: 4 }}
      />
      <Recommendations
        title="Featured Gear"
        subtitle="Top picks for the elite performance"
        filter={{ limit: 4 }}
      />

      {/* Trust Banner */}
      <section className="py-24 bg-orange-600 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-stone-950 mb-12 uppercase tracking-tighter italic">
            Ready to Elevate Your Performance?
          </h2>
          <div className="flex flex-wrap justify-center gap-16 md:gap-24 text-stone-900">
            <div className="flex flex-col items-center">
              <span className="text-5xl md:text-6xl font-black text-stone-950 tracking-tighter italic">
                15,000+
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] mt-2">
                Athletes Served
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-5xl md:text-6xl font-black text-stone-950 tracking-tighter italic">
                100%
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] mt-2">
                Quality Assurance
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-5xl md:text-6xl font-black text-stone-950 tracking-tighter italic">
                7 Days
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] mt-2">
                Return Policy
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
