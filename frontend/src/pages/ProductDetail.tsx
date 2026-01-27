import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import {
  ShoppingBag,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Star,
  Ruler,
  Truck,
  AlertCircle,
  Zap,
  Info,
  Maximize2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { productService, type Product } from "../services/productService";
import { useCart } from "../context/CartContext";
import { cn } from "../utils/cn";
import Recommendations from "../components/home/Recommendations";

// Helper to sort sizes
const sortSizes = (sizes: string[]) => {
  return sizes.sort((a, b) => {
    // Try to extract numbers
    const numA = parseFloat(a.replace(/[^0-9.]/g, ""));
    const numB = parseFloat(b.replace(/[^0-9.]/g, ""));
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    // Fallback to default string sort
    return a.localeCompare(b);
  });
};

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await productService.getProductById(id);
        setProduct(data);

        // Auto-select size if it's "One Size" (Accessories)
        if (
          data.Category?.name.toLowerCase().includes("accessory") ||
          data.Category?.name.toLowerCase().includes("gear")
        ) {
          setSelectedSize("One Size");
        }
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!loading && product && contentRef.current) {
      const tl = gsap.timeline();
      tl.fromTo(
        imageRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
      ).fromTo(
        contentRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
        "-=0.4",
      );
    }
  }, [loading, product]);

  useEffect(() => {
    if (product?.Variants && product.Variants.length > 0 && !selectedSize) {
      // Pre-select first available size or handling One Size
      if (product.Variants.length === 1) {
        setSelectedSize(product.Variants[0].size);
      }
    }
  }, [product, selectedSize]);

  // Derived values
  const images = product?.ProductImages?.map((img) => img.url) || [];
  const isAccessory =
    product?.Category?.name.toLowerCase().includes("accessory") || false;
  const isShoes =
    product?.Category?.name.toLowerCase().includes("shoe") || false;
  const isClothing =
    product?.Category?.name.toLowerCase().includes("clothing") || false;

  // Derived available sizes from Variants
  const availableSizes = product?.Variants
    ? sortSizes(product.Variants.map((v) => v.size))
    : [];

  // Fallback if no variants (should ideally not happen in production with valid data)
  // If no variants, we can't really sell it with the current backend logic requiring variantId.
  // We'll show empty or handle gracefully.

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      // Alert with animation or toast
      return;
    }

    const selectedVariant = product.Variants?.find(
      (v) => v.size === selectedSize,
    );

    if (!selectedVariant) {
      console.error("Variant not found for selected size");
      return;
    }

    addToCart(product, selectedSize, selectedVariant.id);
    // Open cart drawer or show success state
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1440px] mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-12">
        {/* Navigation / Breadcrumbs */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-orange-600 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to collection
          </button>
          <div className="flex gap-4">
            <button className="p-3 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-3 text-gray-400 hover:text-stone-950 hover:bg-gray-100 rounded-full transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left: Image Gallery (Lg: 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div
              ref={imageRef}
              className="relative aspect-[4/5] bg-gray-100 rounded-[2.5rem] overflow-hidden group cursor-crosshair border border-gray-100 shadow-sm"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              <motion.img
                animate={{ scale: isZoomed ? 1.1 : 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Image Navigation Arrows */}
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? images.length - 1 : prev - 1,
                    );
                  }}
                  className="p-4 bg-white/90 backdrop-blur-md rounded-full shadow-xl hover:bg-orange-600 hover:text-white transition-all active:scale-90"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === images.length - 1 ? 0 : prev + 1,
                    );
                  }}
                  className="p-4 bg-white/90 backdrop-blur-md rounded-full shadow-xl hover:bg-orange-600 hover:text-white transition-all active:scale-90"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Zoom Indicator Badge */}
              <div className="absolute bottom-8 right-8 bg-stone-950/20 backdrop-blur p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "flex-shrink-0 w-24 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-300",
                      currentImageIndex === idx
                        ? "border-orange-600 scale-105 shadow-lg shadow-orange-600/10"
                        : "border-transparent opacity-60 hover:opacity-100 hover:scale-105",
                    )}
                  >
                    <img
                      src={img}
                      alt={`Thumb ${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details (Lg: 5 cols) */}
          <div ref={contentRef} className="lg:col-span-5 flex flex-col pt-4">
            {/* Badges & Brand */}
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-stone-950 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic">
                {product.sportType || "Training"}
              </span>
              <span className="text-orange-600 text-xs font-black uppercase tracking-widest">
                {product.Brand?.name || "Global Elite"}
              </span>
            </div>

            {/* Title & Price */}
            <h1 className="text-4xl md:text-5xl font-black text-stone-950 uppercase tracking-tighter italic leading-none mb-6">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-8">
              <span className="text-3xl font-black text-stone-950 italic">
                Rs {product.price?.toLocaleString() || "12,500"}
              </span>
              <span className="text-lg text-gray-400 line-through italic">
                Rs {((product.price || 12500) + 3000).toLocaleString()}
              </span>
              <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                <Zap className="w-3 h-3 fill-current" />
                Featured Drop
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-10 pb-10 border-b border-gray-100">
              <div className="flex text-orange-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                (42 Elite Reviews)
              </span>
            </div>

            {/* Size Selector */}
            {!isAccessory && (
              <div className="mb-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-stone-950 uppercase tracking-widest">
                    Select Size
                  </h3>
                  <button className="flex items-center text-xs font-bold text-orange-600 hover:underline">
                    <Ruler className="w-4 h-4 mr-1.5" /> Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "py-3.5 rounded-2xl font-black text-xs transition-all duration-300 border-2",
                        selectedSize === size
                          ? "bg-stone-950 border-stone-950 text-white shadow-xl scale-105"
                          : "bg-white border-gray-100 text-stone-950 hover:border-stone-950",
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col gap-4 mb-12">
              <button
                onClick={handleAddToCart}
                className={cn(
                  "w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 text-sm italic",
                  selectedSize
                    ? "bg-orange-600 text-white hover:bg-orange-700 shadow-orange-600/20"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-200",
                )}
              >
                <ShoppingBag className="w-5 h-5" />
                {selectedSize ? "Unlock Greatness" : "Select Your Fit First"}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                Authenticated & Verified by Brothers Shoe
              </div>
            </div>

            {/* Specifications / Features Section */}
            <div className="space-y-8">
              <div className="bg-gray-50 rounded-[2rem] p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-950 mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4 text-orange-600" />
                  Elite Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Technology
                    </p>
                    <p className="text-xs font-bold text-stone-950">
                      {isShoes
                        ? "Impact Absorbing Sole"
                        : isClothing
                          ? "Dri-FIT Advanced"
                          : "Industrial Grade"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Material
                    </p>
                    <p className="text-xs font-bold text-stone-950">
                      {isShoes
                        ? "Engineered Synth Skin"
                        : isClothing
                          ? "Recycled Polyester"
                          : "Reinforced Nylon"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Fit Type
                    </p>
                    <p className="text-xs font-bold text-stone-950">
                      Pro-Performance Fit
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Origin
                    </p>
                    <p className="text-xs font-bold text-stone-950">
                      Global Import
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery / Trust Icons */}
              <div className="grid grid-cols-2 gap-6 px-4">
                <div className="flex flex-col gap-2">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Truck className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-stone-950 uppercase tracking-tighter">
                      Fast Delivery
                    </p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">
                      2-3 Business Days
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-stone-950" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-stone-950 uppercase tracking-tighter">
                      Elite Security
                    </p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">
                      Lifetime Authentic
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Recommendations */}
        <div className="mt-32 pt-20 border-t border-gray-100">
          <Recommendations
            title="Similar Drops"
            subtitle="Complete your elite kit"
            filter={{
              sportType: product.sportType,
              limit: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
