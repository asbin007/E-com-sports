import type { Product } from "../../services/productService";
import { cn } from "../../utils/cn";

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

/** 11px uppercase, 1.5px border, 2px tag radius. Flat — these are printed tags. */
const BADGE =
  "inline-flex items-center rounded-tag border-[1.5px] px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-[0.12em]";

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
    layout === "stack" ? "flex flex-col items-start gap-1.5" : "flex flex-wrap gap-1.5";

  return (
    <div className={wrapper}>
      {/* A discount sits over a photo, so it is a solid crimson fill, never a
          soft chip — and never the brass accent, which means "action". */}
      {discount > 0 && (
        <span className={cn(BADGE, "border-sale-bright bg-sale-bright text-on-sale")}>
          <span className="tabular-nums">-{discount}</span>
          <span>%</span>
        </span>
      )}
      {isFeatured && (
        <span className={cn(BADGE, "border-inverse bg-inverse text-inverse")}>
          Featured
        </span>
      )}
      {/* Pitch is the shop's "good news" colour: new stock on the shelf. */}
      {isNew && (
        <span className={cn(BADGE, "border-pitch bg-card text-pitch")}>New in</span>
      )}
    </div>
  );
};

export default ProductBadges;
// eslint-disable-next-line react-refresh/only-export-components
export { computeDiscountPercent, isWithinNewWindow };
