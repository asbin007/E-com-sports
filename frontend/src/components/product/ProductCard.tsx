import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../services/productService";
import { NO_IMAGE_PLACEHOLDER } from "../../utils/placeholder";
import ProductBadges, { computeDiscountPercent } from "./ProductBadges";
import { cn } from "../../utils/cn";

const formatPrice = (n: number) => `Rs ${n.toLocaleString()}`;

const resolveImageUrl = (product: Product): string => {
  const imgs = (product.images ?? []) as Array<unknown>;
  for (const raw of imgs) {
    if (raw && typeof raw === "object" && (raw as { isThumbnail?: boolean }).isThumbnail) {
      const url = (raw as { url?: string | null }).url;
      if (url) return url;
    }
  }
  for (const raw of imgs) {
    if (typeof raw === "string" && raw.trim()) return raw;
    if (raw && typeof raw === "object") {
      const url = (raw as { url?: string | null }).url;
      if (url && url.trim()) return url;
    }
  }
  return NO_IMAGE_PLACEHOLDER;
};

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const price = product.price ?? product.variants?.[0]?.price ?? 0;
  const original = product.originalPrice ?? product.variants?.[0]?.originalPrice ?? 0;
  const discount = computeDiscountPercent(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, margin: "-50px" }}
      onClick={() => navigate(`/product/${product.id}`)}
      className="group cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-secondary border border-border-primary mb-4 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-accent/10 group-hover:border-accent/20 group-hover:-translate-y-1">
        {/* Main Image - using CSS hover for better performance */}
        <img
          src={resolveImageUrl(product)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10">
          <ProductBadges product={product} layout="stack" />
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={cn(
            "absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
            "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
            isLiked
              ? "bg-red-500 text-white opacity-100 translate-x-0"
              : "bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-red-500 hover:text-white"
          )}
          aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
        </button>

        {/* Quick Actions Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${product.id}`);
              }}
              className="flex-1 py-3.5 bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-accent/40 hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              Quick View
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${product.id}`);
              }}
              className="w-12 py-3.5 bg-white/90 backdrop-blur-sm text-gray-800 rounded-xl font-bold shadow-lg hover:bg-white transition-colors flex items-center justify-center active:scale-95"
              aria-label="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-2 px-1">
        {/* Brand */}
        <p className="text-[10px] font-bold text-accent uppercase tracking-[0.15em]">
          {product.Brand?.name || "Premium Gear"}
        </p>

        {/* Name */}
        <h3 className="font-bold text-primary text-sm leading-tight line-clamp-2 group-hover:text-accent transition-colors duration-300 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* No rating shown: the card is only given a Product, which carries no
            review stats. A fabricated figure costs more trust than none. */}

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-1">
          <p className="text-lg font-black text-primary tracking-tight">
            {formatPrice(price)}
          </p>
          {discount > 0 && (
            <>
              <p className="text-xs text-muted line-through font-medium">
                {formatPrice(original)}
              </p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {discount}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
