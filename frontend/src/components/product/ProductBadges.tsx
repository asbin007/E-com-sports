import { Sparkles, Star, Tag } from "lucide-react";
import type { Product } from "../../services/productService";

const NEW_WINDOW_DAYS = 14;

const isWithinNewWindow = (createdAt?: string): boolean => {
  if (!createdAt) return false;
  const ts = new Date(createdAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};

const computeDiscountPercent = (product: Product): number => {
  const price = product.price ?? product.variants?.[0]?.price ?? 0;
  const original =
    product.originalPrice ?? product.variants?.[0]?.originalPrice ?? 0;
  if (!price || !original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
};

interface ProductBadgesProps {
  product: Product;
  /** "stack": badges stack vertically (good on cards). "row": laid out horizontally. */
  layout?: "stack" | "row";
}

const ProductBadges = ({ product, layout = "stack" }: ProductBadgesProps) => {
  const discount = computeDiscountPercent(product);
  const isNew = isWithinNewWindow(product.createdAt);
  const isFeatured = product.isFeatured === true;

  if (!discount && !isNew && !isFeatured) return null;

  const wrapper =
    layout === "stack" ? "flex flex-col gap-1.5" : "flex flex-wrap gap-1.5";

  return (
    <div className={wrapper}>
      {discount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
          <Tag className="w-3 h-3" />-{discount}%
        </span>
      )}
      {isFeatured && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
          <Star className="w-3 h-3 fill-current" />
          Featured
        </span>
      )}
      {isNew && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3 h-3" />
          New
        </span>
      )}
    </div>
  );
};

export default ProductBadges;
export { computeDiscountPercent, isWithinNewWindow };
