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
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Dynamic Background Element */}
      <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
        <Activity className="w-96 h-96 -rotate-12" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-stone-950 text-orange-500 font-black text-xs uppercase tracking-[0.2em] shadow-xl mb-8"
          >
            <Sparkles className="w-4 h-4" />
            GEAR UP FOR YOUR GAME
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-black text-stone-950 tracking-tighter uppercase italic">
            Shop by <span className="text-orange-600">Sport</span>
          </h2>
          <p className="text-gray-500 text-lg mt-6 max-w-xl mx-auto font-medium">
            Find specialized footwear tailored for every athletic discipline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -12 }}
              onClick={() =>
                navigate(
                  `/${cat.name.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`,
                )
              }
              className="group relative h-96 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-2xl border border-stone-100"
            >
              {/* Background Image */}
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

              {/* Floating Overlay */}
              <div className="absolute inset-0 p-10 flex flex-col justify-end">
                <div
                  className={`w-16 h-16 rounded-2xl bg-stone-950 border border-white/10 flex items-center justify-center text-orange-600 mb-6 shadow-2xl transform group-hover:-translate-y-2 transition-transform duration-500`}
                >
                  <cat.icon className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter italic">
                  {cat.name}
                </h3>
                <div className="flex items-center gap-3 text-orange-500 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                  Browse Collection <ArrowRight className="w-4 h-4" />
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
