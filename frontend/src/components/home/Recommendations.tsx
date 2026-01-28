import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, Star, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { productService } from "../../services/productService";
import type { Product } from "../../services/productService";

interface RecommendationsProps {
  title: string;
  subtitle: string;
  filter?: {
    limit?: number;
    categoryId?: string;
    search?: string;
  };
}

const Recommendations = ({ title, subtitle, filter }: RecommendationsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await productService.getAllProducts({
          limit: filter?.limit || 4,
          categoryId: filter?.categoryId,
          search: filter?.search,
        });
        setProducts(data.data || []);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [filter]);

  if (loading) return null;

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-100 text-orange-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4"
            >
              <Sparkles className="w-3 h-3" />
              PEAK PERFORMANCE
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black text-stone-950 tracking-tighter uppercase italic">
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
            <p className="text-gray-500 text-lg mt-2 font-medium">{subtitle}</p>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="group flex items-center gap-2 text-stone-950 font-black uppercase tracking-widest text-sm hover:text-orange-600 transition-colors"
          >
            View Full Catalog
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group relative bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden"
            >
              {/* Badges */}
              <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
                {idx % 2 === 0 ? (
                  <span className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest italic animate-pulse">
                    Hot Drop
                  </span>
                ) : (
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest italic animate-bounce">
                    New Era
                  </span>
                )}
              </div>

              {/* Product Image */}
              <div className="relative aspect-square mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-8 group-hover:bg-white transition-colors duration-500">
                <img
                  src={
                    product.images && product.images[0]
                      ? product.images[0].startsWith("http")
                        ? product.images[0]
                        : `https://res.cloudinary.com/dxpe7jikz/image/upload/v1/${product.images[0].replace("/uploads/", "")}`
                      : "https://via.placeholder.com/300"
                  }
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
                />
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-sm hover:bg-orange-600 hover:text-white transition-all scale-0 group-hover:scale-100 cursor-pointer">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="px-2">
                <div className="flex items-center gap-1 text-orange-500 mb-2 opacity-60">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    4.9 Elite Rating
                  </span>
                </div>
                <h3 className="font-black text-stone-950 uppercase tracking-tighter italic text-2xl mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-[12px] mb-6 line-clamp-2 min-h-[2.5rem] font-medium leading-relaxed">
                  {product.description ||
                    "Engineered for the modern athlete who demands both performance and style in every step."}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <span className="text-2xl font-black text-stone-950 italic tracking-tighter">
                    Rs. {product.price || "TBD"}
                  </span>
                  <button
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="w-10 h-10 bg-stone-950 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-all hover:scale-110 active:scale-95 group/btn"
                  >
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Recommendations;
