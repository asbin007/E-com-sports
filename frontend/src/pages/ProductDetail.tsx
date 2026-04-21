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
import { getImageUrl } from "../utils/imageUrl";
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
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
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
        const isAccessory = data.Category?.needsSize === false;
        if (isAccessory) {
          setSelectedSize("One Size");
        }

        // Auto-select if there is only one option for size or color
        if (data.Variants && data.Variants.length > 0) {
          const uniqueSizes = Array.from(
            new Set(data.Variants.map((v) => v.size).filter(Boolean)),
          );
          const uniqueColors = Array.from(
            new Set(data.Variants.map((v) => v.color).filter(Boolean)),
          );

          if (uniqueSizes.length === 1) {
            setSelectedSize(uniqueSizes[0] as string);
          }
          if (uniqueColors.length === 1) {
            setSelectedColor(uniqueColors[0] as string);
          }
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

  // Find matching variant whenever selection changes
  useEffect(() => {
    if (product?.Variants) {
      const variant = product.Variants.find(
        (v) =>
          (!selectedSize || v.size === selectedSize) &&
          (!selectedColor || v.color === selectedColor),
      );
      setSelectedVariant(variant || null);
    }
  }, [selectedSize, selectedColor, product]);

  const images = (product?.ProductImages || [])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => img.url);

  const categoryMeta = product?.Category;
  const needsSize = categoryMeta?.needsSize ?? true;
  const sizeType = categoryMeta?.sizeType ?? null;

  const isShoes = sizeType === "shoe";
  const isJersey = categoryMeta?.slug === "jersey";
  const isSocks = categoryMeta?.slug === "socks";
  const isAccessory = !needsSize;

  // Derive "isNew" from createdAt (last 7 days)
  const isNew = product?.createdAt 
    ? (new Date().getTime() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  // Derived available sizes from variants
  const availableSizes = product?.Variants
    ? sortSizes(
        Array.from(new Set(product.Variants.map((v) => v.size).filter(Boolean))),
      )
    : [];

  // Derived available colors from variants
  const availableColors = product?.Variants
    ? Array.from(new Set(product.Variants.map((v) => v.color).filter(Boolean)))
    : [];

  const hasSizes = availableSizes.length > 0;
  const hasColors = availableColors.length > 0;

  const handleAddToCart = () => {
    if (!product) return;

    // Check if we need a selection
    if (hasSizes && !selectedSize) {
      alert(
        `Please select a ${isShoes ? "shoe size" : isJersey ? "jersey size" : "size"}`,
      );
      return;
    }

    if (hasColors && !selectedColor) {
      alert("Please select a color");
      return;
    }

    // Find the specific variant to get the correct price and stock
    const variant = product.Variants?.find(
      (v) =>
        (!selectedSize || v.size === selectedSize) &&
        (!selectedColor || v.color === selectedColor),
    );

    if (product.Variants && product.Variants.length > 0 && !variant) {
      alert("This combination is currently unavailable");
      return;
    }

    if (variant && variant.stock <= 0) {
      alert("This item is out of stock");
      return;
    }

    addToCart(
      product,
      variant?.id || null,
      selectedSize || null,
      selectedColor || null,
      variant?.price || product.price || 0,
    );
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
                {product.ProductType?.name || "Training"}
              </span>
              {product.Sport && (
                <span className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center gap-1.5">
                  {product.Sport.iconUrl && <img src={product.Sport.iconUrl} className="w-3 h-3 invert" alt="" />}
                  {product.Sport.name}
                </span>
              )}
              {product.gender && (
                <span className="bg-gray-100 text-stone-950 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic border border-gray-200">
                  {product.gender}
                </span>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {product.Brand?.logo && <img src={product.Brand.logo} className="w-6 h-6 object-contain" alt="" />}
                <span className="text-orange-600 text-xs font-black uppercase tracking-widest">
                  {product.Brand?.name || "Global Elite"}
                </span>
              </div>
            </div>

            {/* Title & Price */}
            <h1 className="text-4xl md:text-5xl font-black text-stone-950 uppercase tracking-tighter italic leading-none mb-6">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-8">
              <span className="text-3xl font-black text-stone-950 italic">
                Rs {(selectedVariant?.price || product.price)?.toLocaleString()}
              </span>
              {(selectedVariant?.originalPrice || product.originalPrice) &&
                (selectedVariant?.originalPrice || product.originalPrice) >
                  (selectedVariant?.price || product.price || 0) && (
                  <>
                    <span className="text-lg text-gray-400 line-through italic">
                      Rs {(
                        selectedVariant?.originalPrice || product.originalPrice
                      ).toLocaleString()}
                    </span>
                    <div className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                      {Math.round(
                        (((selectedVariant?.originalPrice ||
                          product.originalPrice) -
                          (selectedVariant?.price || product.price || 0)) /
                          (selectedVariant?.originalPrice ||
                            product.originalPrice)) *
                          100,
                      )}
                      % OFF
                    </div>
                  </>
                )}
              {isNew && (
                <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                  <Zap className="w-3 h-3 fill-current" />
                  New Drop
                </div>
              )}
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

            {/* Variant Selection Group */}
            <div className="space-y-8 mb-12">
              {/* Size/Variant Selector — Compact & Professional */}
              {hasSizes && (availableSizes.length > 1 || !isAccessory) && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      {isShoes
                        ? "Shoe Size (UK)"
                        : isJersey
                          ? "Jersey Size"
                          : isSocks
                            ? "Sock Size"
                            : categoryMeta?.name.toLowerCase().includes("bat")
                              ? "Weight / Size"
                              : isAccessory
                                ? "Option"
                                : "Size"}
                    </h3>
                    {(isShoes || isJersey) && (
                      <button className="flex items-center text-[10px] font-black text-orange-600 uppercase tracking-widest hover:opacity-70 transition-opacity">
                        <Ruler className="w-3.5 h-3.5 mr-1.5" /> Size Guide
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const isAvailable = product.Variants?.some(
                        (v) =>
                          v.size === size &&
                          (!selectedColor || v.color === selectedColor) &&
                          v.stock > 0,
                      );
                      return (
                        <button
                          key={size}
                          disabled={!isAvailable}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "min-w-[54px] h-10 px-3 rounded-xl font-black text-[11px] transition-all duration-300 border-2 uppercase italic tracking-tighter",
                            selectedSize === size
                              ? "bg-stone-950 border-stone-950 text-white shadow-lg"
                              : isAvailable
                                ? "bg-white border-gray-100 text-stone-950 hover:border-stone-950"
                                : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50",
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Selector — Compact Dots */}
              {availableColors.length > 1 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      Select Color
                    </h3>
                    {selectedColor && (
                      <span className="text-[10px] font-black text-stone-950 uppercase tracking-widest italic">
                        {selectedColor}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                        className={cn(
                          "group relative w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                          selectedColor === color
                            ? "border-stone-950 scale-110 shadow-md"
                            : "border-gray-100 hover:border-stone-300",
                        )}
                      >
                        <span
                          className="w-5 h-5 rounded-full block border border-black/5"
                          style={{
                            backgroundColor: CSS.supports(
                              "color",
                              color.toLowerCase(),
                            )
                              ? color.toLowerCase()
                              : "transparent",
                            backgroundImage: !CSS.supports(
                              "color",
                              color.toLowerCase(),
                            )
                              ? "linear-gradient(135deg, #e0e0e0 25%, #bdbdbd 25%, #bdbdbd 50%, #e0e0e0 50%, #e0e0e0 75%, #bdbdbd 75%)"
                              : undefined,
                          }}
                        />
                        {selectedColor === color && (
                          <span className="absolute -inset-[3px] rounded-full border border-stone-950/20" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-4 mb-12">
              <button
                onClick={handleAddToCart}
                disabled={selectedVariant?.stock <= 0}
                className={cn(
                  "w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 text-sm italic",
                  (selectedVariant || !product.Variants?.length) &&
                    (selectedVariant?.stock > 0 || !product.Variants?.length)
                    ? "bg-orange-600 text-white hover:bg-orange-700 shadow-orange-600/20"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-200",
                )}
              >
                <ShoppingBag className="w-5 h-5" />
                {selectedVariant?.stock <= 0
                  ? "Out of Stock"
                  : (hasSizes && !selectedSize) || (hasColors && !selectedColor)
                    ? "Select Your Fit First"
                    : "Unlock Greatness"}
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
                  {/* Dynamic Product Attributes from Backend */}
                  {product.ProductAttributes && product.ProductAttributes.length > 0 ? (
                    product.ProductAttributes.map((attr) => (
                      <div key={attr.id} className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {attr.attributeName}
                        </p>
                        <p className="text-xs font-bold text-stone-950">
                          {attr.attributeValue}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] font-bold text-gray-400 uppercase italic col-span-full">
                      Detailed specifications loading from the vault...
                    </p>
                  )}

                  {/* Shared fields (all categories) */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Colors</p>
                    <p className="text-xs font-bold text-stone-950">
                      {availableColors.length > 0
                        ? availableColors.join(", ")
                        : "Multi-Color"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Gender</p>
                    <p className="text-xs font-bold text-stone-950">{product.gender || "Unisex"}</p>
                  </div>
                  {product.ProductType && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipment Class</p>
                      <p className="text-xs font-bold text-stone-950">{product.ProductType.name}</p>
                    </div>
                  )}
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
              categoryId: product.categoryId,
              limit: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
