import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  Zap,
  Gift,
  MapPin,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";

const Features = () => {
  const features = [
    {
      icon: <Truck className="h-8 w-8" />,
      title: "Free Shipping",
      description: "Across all major cities in Nepal on orders over Rs 5000.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <RotateCcw className="h-8 w-8" />,
      title: "7-Day Returns",
      description: "Hassle-free exchange & return policy if not satisfied.",
      color: "from-green-500 to-green-600",
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: "Secure Payment",
      description: "Digital wallet support & Cash on Delivery available.",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: <Headphones className="h-8 w-8" />,
      title: "Expert Support",
      description: "24/7 priority support for all your product queries.",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Delivery",
      description: "Expedited shipping for Kathmandu valley residents.",
      color: "from-red-500 to-red-600",
    },
    {
      icon: <Gift className="h-8 w-8" />,
      title: "Exclusive Gifts",
      description: "Get complimentary accessories with every premium shoe.",
      color: "from-pink-500 to-pink-600",
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "Nationwide",
      description:
        "Reliable delivery network stretching from Mechi to Mahakali.",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Quality Plus",
      description: "Direct-from-factory inspection for 100% flawlessness.",
      color: "from-teal-500 to-teal-600",
    },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-black text-stone-950 mb-4 tracking-tighter uppercase italic"
          >
            Why Choose Brothers Shoe?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed font-medium"
          >
            We redefined the athletic footwear industry in Nepal by prioritizing
            authentic quality, transparent pricing, and unparalleled support.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -10 }}
              className={`group relative p-10 rounded-3xl border border-stone-100 bg-white transition-all duration-500 hover:shadow-2xl hover:shadow-orange-600/10 hover:border-orange-600/30 cursor-pointer`}
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-xl`}
              >
                {feature.icon}
              </div>
              <h3 className="font-black text-xl mb-3 text-stone-950 uppercase tracking-tight italic">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">
                {feature.description}
              </p>

              {/* Micro-sparkle decoration */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Zap className="w-5 h-5 text-orange-200" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Banner inside Features */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 relative overflow-hidden bg-stone-900 rounded-[3rem] p-16 text-white shadow-2xl border border-white/5"
        >
          {/* Decorative background grid */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-center md:text-left">
              <h3 className="text-4xl font-black mb-3 uppercase tracking-tighter italic">
                🎉 Join our Athletes Club
              </h3>
              <p className="text-gray-400 text-lg max-w-lg font-medium">
                Get 10% off on your first purchase and early access to drops.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <button className="bg-orange-600 text-stone-950 px-10 py-5 rounded-xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all hover:scale-105 shadow-[0_0_20px_rgba(234,88,12,0.3)] active:scale-95">
                Register Now
              </button>
              <button className="bg-stone-800 border border-white/10 text-white px-10 py-5 rounded-xl font-black uppercase tracking-widest hover:bg-stone-700 transition-all active:scale-95">
                Explore Drops
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
