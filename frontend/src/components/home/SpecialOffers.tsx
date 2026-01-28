import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Star,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { productService } from "../../services/productService";
import type { Product } from "../../services/productService";

interface SpecialOffersProps {
  title?: string;
}

const SpecialOffers = ({
  title = "Trending Collections",
}: SpecialOffersProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const autoPlayRef = useRef<any>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const data = await productService.getAllProducts({ limit: 5 });
        setProducts(data.data || []);
      } catch (err) {
        console.error("Failed to fetch special offers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

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

  if (loading)
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-[3rem] animate-pulse">
        <div className="text-gray-400 font-bold">Discovering Greatness...</div>
      </div>
    );

  if (products.length === 0) return null;

  return (
    <section className="py-24 bg-stone-950 overflow-hidden relative">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter uppercase italic">
              {title.split(" ").map((word, i) => (
                <span
                  key={i}
                  className={
                    i === title.split(" ").length - 1 ? "text-orange-600" : ""
                  }
                >
                  {word}{" "}
                </span>
              ))}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed font-medium">
              Most wanted silhouettes and high-performance drops of the season.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handlePrev}
              className="w-16 h-16 bg-stone-900 border border-white/5 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:bg-orange-600 transition-all active:scale-95"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={handleNext}
              className="w-16 h-16 bg-stone-900 border border-white/5 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:bg-orange-600 transition-all active:scale-95"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </div>

        <div className="relative h-[650px] md:h-[550px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: "circOut" }}
              className="absolute inset-0 bg-stone-900 rounded-[3rem] shadow-2xl overflow-hidden border border-white/5"
            >
              <div className="flex flex-col md:flex-row h-full">
                {/* Product Content */}
                <div className="w-full md:w-1/2 p-12 md:p-20 flex flex-col justify-center bg-stone-900 relative">
                  <div className="flex items-center gap-2 mb-8 text-orange-500 font-black tracking-[0.2em] text-xs uppercase">
                    <Zap className="w-5 h-5 fill-current" />
                    HOT DROP OF THE YEAR
                  </div>

                  <h3 className="text-5xl md:text-6xl font-black text-white mb-6 leading-none uppercase tracking-tighter italic">
                    {products[currentIdx].name}
                  </h3>

                  <p className="text-gray-400 text-lg mb-10 line-clamp-3 leading-relaxed font-medium">
                    {products[currentIdx].description}
                  </p>

                  <div className="flex items-center gap-8 mb-12">
                    <div className="bg-orange-600 text-stone-950 px-8 py-4 rounded-xl font-black text-2xl italic tracking-tighter shadow-[0_0_20px_rgba(234,88,12,0.3)]">
                      Rs. {products[currentIdx].price}
                    </div>
                    <div className="flex items-center gap-1 text-orange-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() =>
                        navigate(`/product/${products[currentIdx].id}`)
                      }
                      className="bg-white text-stone-950 px-12 py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-3"
                    >
                      <ShoppingBag className="w-6 h-6" />
                      Add to Cart
                    </button>
                  </div>
                </div>

                {/* Product Image */}
                <div className="w-full md:w-1/2 relative bg-stone-800 flex items-center justify-center p-12 overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-900/50 to-transparent"></div>

                  <motion.img
                    initial={{ rotate: 10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1.15 }}
                    whileHover={{ scale: 1.25, rotate: -3 }}
                    src={
                      products[currentIdx].images &&
                      products[currentIdx].images[0]
                        ? products[currentIdx].images[0].startsWith("http")
                          ? products[currentIdx].images[0]
                          : `https://res.cloudinary.com/dxpe7jikz/image/upload/v1/${products[currentIdx].images[0].replace("/uploads/", "")}`
                        : "https://via.placeholder.com/600"
                    }
                    alt={products[currentIdx].name}
                    className="w-full h-full object-contain filter drop-shadow-[0_40px_80px_rgba(0,0,0,0.4)] relative z-10 transition-transform duration-700"
                  />

                  <div className="absolute top-12 right-12 z-20">
                    <span className="bg-stone-950/80 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 font-black text-xs text-white uppercase tracking-widest italic">
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

        {/* Indicator dots */}
        <div className="flex justify-center gap-4 mt-12">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`h-2.5 transition-all duration-500 rounded-full ${idx === currentIdx ? "w-16 bg-orange-600" : "w-3 bg-stone-800 hover:bg-stone-700"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;
