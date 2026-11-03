import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  isProductSoldOut,
  isVariantSellable,
  variantStock,
  type Product,
} from "../../services/productService";
import { NO_IMAGE_PLACEHOLDER } from "../../utils/placeholder";
import ProductBadges, { computeDiscountPercent } from "./ProductBadges";
import { cn } from "../../utils/cn";

const formatPrice = (n: number) => `Rs ${n.toLocaleString()}`;

/** Chip shell: 11px uppercase, 1.5px border, nothing rounder than a printed tag. */
const CHIP =
  "inline-flex items-center rounded-tag border-[1.5px] px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-[0.12em]";

/** The printed kit run, for sizes that are letters rather than numbers. */
const LETTER_RUN = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

/**
 * Numeric sizes (footballs 3/4/5, boots in UK sizes) sort numerically, kit sizes
 * follow the printed run, and anything else (bat handles SH / H / LB) falls back
 * to alphabetical so the order is at least stable.
 */
const compareSizes = (a: string, b: string): number => {
  const na = Number.parseFloat(a.replace(/[^0-9.]/g, ""));
  const nb = Number.parseFloat(b.replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  const ia = LETTER_RUN.indexOf(a.toUpperCase());
  const ib = LETTER_RUN.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b);
};

export interface SizeOption {
  size: string;
  inStock: boolean;
}

interface SizeRunProps {
  sizes: SizeOption[];
  selected?: string;
  onSelect?: (size: string) => void;
  /** Cards use the 32px box; the detail page sets a taller one. */
  boxClassName?: string;
  className?: string;
}

/**
 * The size run — the structural idea of the whole storefront. A real shop shows
 * what it has in your size before anything else, so every size the product
 * actually carries gets a box: available, selected (inverted) or struck
 * through. A sold-out box is `disabled`, so it can never be selected and
 * therefore can never reach the cart.
 */
export const SizeRun = ({
  sizes,
  selected,
  onSelect,
  boxClassName,
  className,
}: SizeRunProps) => {
  if (sizes.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {sizes.map(({ size, inStock }) => {
        const isSelected = inStock && selected === size;
        return (
          <button
            key={size}
            type="button"
            disabled={!inStock}
            aria-pressed={isSelected}
            aria-label={inStock ? `Size ${size}` : `Size ${size}, sold out`}
            onClick={(event) => {
              // Cards are clickable as a whole; a size box must not navigate.
              event.stopPropagation();
              onSelect?.(size);
            }}
            className={cn(
              // WCAG 2.5.5: the tappable region never shrinks below 44x44.
              "relative flex min-h-[44px] min-w-[44px] items-center justify-center px-2",
              "rounded-tag border-2 font-display text-[19px] font-semibold leading-none tabular-nums",
              "transition duration-snap ease-snap",
              inStock
                ? isSelected
                  ? "border-inverse bg-inverse text-inverse"
                  : "border-inverse text-primary hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
                : "cursor-not-allowed border-border-primary text-muted",
              boxClassName
            )}
          >
            {size}
            {!inStock && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0.5 right-0.5 top-1/2 h-0.5 -translate-y-1/2 -rotate-[30deg] bg-inverse/40"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

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
  const reduce = useReducedMotion();
  const [isLiked, setIsLiked] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");

  const price = product.price ?? product.variants?.[0]?.price ?? 0;
  const original = product.originalPrice ?? product.variants?.[0]?.originalPrice ?? 0;
  const discount = computeDiscountPercent(product);

  // Sizes and stock come straight off the variant rows. A product with no sized
  // variants gets no size run at all — nothing here invents a size.
  const { sizes, stock } = useMemo(() => {
    const all = product.variants ?? [];
    const sellable = all.filter((v) => v.isActive !== false);
    const named = [
      ...new Set(
        sellable
          .map((v) => v.size)
          .filter((s): s is string => !!s && s.toLowerCase() !== "one size")
      ),
    ].sort(compareSizes);
    return {
      sizes: named.map<SizeOption>((size) => ({
        size,
        // A size whose rows carry no `stock` field is unknown, so it stays
        // selectable; only a reported count of zero strikes it through.
        inStock: sellable.some((v) => v.size === size && isVariantSellable(v)),
      })),
      // Counts only the rows that actually report a number, so the chip never
      // claims a figure the API did not send.
      stock: sellable.reduce((sum, v) => sum + (variantStock(v) ?? 0), 0),
    };
  }, [product.variants]);

  const soldOut = isProductSoldOut(product.variants);

  return (
    <motion.div
      // Mount-driven, never observer-driven: a card below the fold must not sit
      // at opacity 0 waiting for IntersectionObserver. Opacity only, because
      // animating `y` leaves framer's inline transform on the element and the
      // Tailwind hover lift in the class list below could never apply.
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, delay: Math.min(index, 8) * 0.04, ease: [0.2, 0.7, 0.3, 1] }}
      onClick={() => navigate(`/product/${product.id}`)}
      className="group cursor-pointer overflow-hidden rounded-card border-2 border-inverse bg-card transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
    >
      {/* Image: 4:5 box closed off by a 2px ink rule */}
      <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-inverse bg-secondary">
        <img
          src={resolveImageUrl(product)}
          alt={product.name}
          className={cn("h-full w-full object-cover", soldOut && "opacity-50 grayscale")}
        />

        <div className="absolute left-2 top-2 z-10">
          <ProductBadges product={product} layout="stack" />
        </div>

        {/* NOTE: wishlist is local-only state, same as before — no service call. */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={cn(
            "absolute right-2 top-2 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-tag border-2 transition duration-snap ease-snap",
            isLiked
              ? "border-accent bg-accent text-inverse"
              : "border-inverse bg-card text-primary hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
          )}
          aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isLiked}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        </button>

        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-inverse px-2 py-1 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-inverse">
            Sold out
          </span>
        )}

        {/* Single CTA, same destination as the card itself */}
        {!soldOut && (
          <div className="absolute inset-x-2 bottom-2 translate-y-1 opacity-0 transition duration-snap ease-snap group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/product/${product.id}`);
              }}
              className="min-h-[44px] w-full rounded-tag border-2 border-inverse bg-accent font-display text-[19px] font-semibold uppercase leading-none tracking-[0.04em] text-inverse transition duration-snap ease-snap hover:bg-accent-hover"
            >
              View kit
            </button>
          </div>
        )}
      </div>

      {/* Body: club / brand, name, price, size run, chips */}
      <div className="space-y-2 p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
          {product.Brand?.name || product.Category?.name || "Kit room"}
        </p>

        <h3 className="line-clamp-2 font-display text-[29px] font-semibold uppercase leading-[0.92] text-primary">
          {product.name}
        </h3>

        {/* No rating shown: the card is only given a Product, which carries no
            review stats. A fabricated figure costs more trust than none. */}

        <div className="flex items-baseline gap-2">
          <span className="font-display text-[23px] font-semibold leading-none tabular-nums text-primary">
            {formatPrice(price)}
          </span>
          {discount > 0 && (
            <span className="font-display text-[17px] leading-none tabular-nums text-muted line-through">
              {formatPrice(original)}
            </span>
          )}
        </div>

        <SizeRun sizes={sizes} selected={selectedSize} onSelect={setSelectedSize} />

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {stock > 0 && (
            <span className={cn(CHIP, "border-pitch text-pitch")}>
              <span className="tabular-nums">{stock}</span>
              <span className="ml-1">in stock</span>
            </span>
          )}
          {discount > 0 && (
            <span className={cn(CHIP, "border-marigold bg-marigold-soft text-marigold")}>
              <span className="tabular-nums">{discount}</span>
              <span className="ml-1">% off</span>
            </span>
          )}
          <span className={cn(CHIP, "border-border-primary text-tertiary")}>COD</span>
          <span className={cn(CHIP, "border-border-primary text-tertiary")}>
            Nepal delivery
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
