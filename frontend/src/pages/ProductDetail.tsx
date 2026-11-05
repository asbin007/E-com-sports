import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
  Truck,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  Minus,
  Plus,
  PackageX,
  Share2,
  AlertTriangle,
  RotateCcw,
  Wallet,
} from "lucide-react";
import {
  isVariantSellable,
  productService,
  variantStock,
  type Product,
} from "../services/productService";
import { reviewService, type ReviewStats } from "../services/reviewService";
import { useCart } from "../context/CartContext";
import { cn } from "../utils/cn";
import { whatsappUrl } from "../data/store";
import { NO_IMAGE_PLACEHOLDER } from "../utils/placeholder";
import ProductBadges from "../components/product/ProductBadges";
import { SizeRun, type SizeOption } from "../components/product/ProductCard";
import Recommendations from "../components/home/Recommendations";
import ProductReviews from "../components/reviews/ProductReviews";
import WriteReview from "../components/reviews/WriteReview";
import { ProductDetailSkeleton } from "../components/ui/Skeleton";

type ProductImageObject = {
  id?: string;
  url?: string | null;
  altText?: string;
  isThumbnail?: boolean;
  sortOrder?: number;
};

/** Reveal: 160ms, 12px of travel, visible at rest. */
const REVEAL = { duration: 0.16, ease: [0.2, 0.7, 0.3, 1] } as const;

/** Icon-only controls hold the 44px floor. */
const ICON_BUTTON =
  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-tag border-2 transition duration-snap ease-snap";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const reduce = useReducedMotion();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsVersion, setReviewsVersion] = useState(0);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setLoadError(true);
      return;
    }
    setLoading(true);
    setLoadError(false);
    setSelectedSize("");
    setSelectedColor("");
    setQuantity(1);
    setCurrentImageIndex(0);
    try {
      const data = await productService.getProductById(id);
      setProduct(data);
      if (data.variants && data.variants.length > 0) {
        const sizes = [...new Set(data.variants.map((v) => v.size).filter(Boolean))];
        const colors = [...new Set(data.variants.map((v) => v.color).filter(Boolean))];
        if (sizes.length === 1) setSelectedSize(sizes[0]);
        if (colors.length === 1) setSelectedColor(colors[0]);
      }
      if (data.Category?.needsSize === false) {
        setSelectedSize("One Size");
      }
    } catch (error) {
      console.error("Failed to fetch product", error);
      setProduct(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Real review stats power the headline rating; refetched when a review is added.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    reviewService
      .getProductReviews(id, 1, 1)
      .then((res) => {
        if (!cancelled) setReviewStats(res.stats);
      })
      .catch(() => {
        if (!cancelled) setReviewStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reviewsVersion]);

  const images = ((product?.images || []) as Array<string | ProductImageObject>)
    .map((img) => {
      if (typeof img === "string") return { url: img, sortOrder: 0 };
      return { url: img.url || "", sortOrder: img.sortOrder || 0 };
    })
    .filter((img) => !!img.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => img.url);

  const variants = product?.variants || [];
  const hasVariants = variants.length > 0;
  // A row with no `stock` field is unknown, not empty, so it keeps counting as
  // available — absent data must never read as sold out.
  const isAvailable =
    hasVariants && variants.some((v) => v.isActive !== false && isVariantSellable(v));

  const availableSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))].sort((a, b) => {
    const numA = parseFloat(a.replace(/[^0-9.]/g, ""));
    const numB = parseFloat(b.replace(/[^0-9.]/g, ""));
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    const order = ["XS", "S", "M", "L", "XL", "XXL"];
    return order.indexOf(a) - order.indexOf(b);
  });
  const availableColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  // Which options the shopper must actually pick before a variant is identified.
  const sizeRequired = availableSizes.length > 0;
  const colorRequired = availableColors.length > 1;
  const needsSelection =
    (sizeRequired && !selectedSize) || (colorRequired && !selectedColor);

  // Resolves a variant only for a fully-specified option combination, so an
  // unchosen option can never fall through to variants[0].
  const findVariant = (size: string, color: string) => {
    if ((sizeRequired && !size) || (colorRequired && !color)) return undefined;
    return variants.find(
      (v) =>
        (!sizeRequired || v.size === size) && (!colorRequired || v.color === color)
    );
  };

  const selectedVariant = findVariant(selectedSize, selectedColor);

  const variantPrices = variants
    .map((v) => v.price)
    .filter((p): p is number => typeof p === "number" && p > 0);
  const minVariantPrice = variantPrices.length ? Math.min(...variantPrices) : 0;
  const maxVariantPrice = variantPrices.length ? Math.max(...variantPrices) : 0;

  const currentPrice = selectedVariant?.price || product?.price || minVariantPrice || 0;
  const originalPrice = selectedVariant?.originalPrice || product?.originalPrice || 0;
  const inStock = selectedVariant ? isVariantSellable(selectedVariant) : isAvailable;
  /** `null` when the row reports no count: the chip then omits the figure. */
  const stockCount = variantStock(selectedVariant);
  const discount = originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  // Options are chosen but no such variant exists (e.g. size L never made in Red).
  const combinationUnavailable = !needsSelection && hasVariants && !selectedVariant;
  const canAddToCart =
    hasVariants &&
    isAvailable &&
    !needsSelection &&
    !!selectedVariant &&
    isVariantSellable(selectedVariant);
  /** Unknown stock caps nothing; a reported count is the ceiling. */
  const maxQuantity = stockCount ?? Number.POSITIVE_INFINITY;

  // Re-clamp quantity whenever the resolved variant (and therefore its stock) changes.
  const clampQuantityFor = (size: string, color: string) => {
    const stock = variantStock(findVariant(size, color));
    if (stock === null) return;
    setQuantity((q) => (stock > 0 ? Math.min(q, stock) : 1));
  };

  const handleSelectSize = (size: string) => {
    const next = size === selectedSize ? "" : size;
    setSelectedSize(next);
    clampQuantityFor(next, selectedColor);
  };

  const handleSelectColor = (color: string) => {
    const next = color === selectedColor ? "" : color;
    setSelectedColor(next);
    clampQuantityFor(selectedSize, next);
  };

  const handleAddToCart = () => {
    // Hard block: never send a null variantId, or CartContext merges two
    // different sizes into one line and the second one is silently lost.
    if (!product || !canAddToCart || !selectedVariant) return;

    const qty = Math.max(1, Math.min(quantity, maxQuantity));
    for (let i = 0; i < qty; i++) {
      addToCart(product, selectedVariant.id, selectedSize || null, selectedColor || null, currentPrice);
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleShare = async () => {
    if (!product) return;
    const shareUrl = window.location.href;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.name, url: shareUrl });
        return;
      } catch (err) {
        // User dismissed the sheet — do not fall through to the clipboard.
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to share product link", err);
    }
  };

  // The size run is the primary selector here. Availability is exactly the rule
  // the old buttons used, so a sold-out size stays unselectable and unaddable.
  const sizeOptions: SizeOption[] = availableSizes.map((size) => ({
    size,
    inStock: selectedColor
      ? variants.some(
          (v) => v.size === size && v.color === selectedColor && isVariantSellable(v)
        )
      : variants.some((v) => v.size === size && isVariantSellable(v)),
  }));

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (loadError || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={REVEAL}
          className="w-full max-w-md rounded-card border-2 border-inverse bg-card p-8 text-center"
        >
          <AlertTriangle aria-hidden="true" className="mx-auto mb-4 h-8 w-8 text-accent" />
          <h1 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
            Couldn't load this product
          </h1>
          <p className="mt-2 text-sm text-tertiary">
            Something went wrong while fetching this product. Please check your connection and try again.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={fetchProduct}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-tag border-2 border-inverse bg-accent font-display text-[19px] font-semibold uppercase leading-none text-inverse transition duration-snap ease-snap hover:bg-accent-hover"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Try again
            </button>
            <Link
              to="/shop"
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-tag border-2 border-inverse bg-card font-display text-[19px] font-semibold uppercase leading-none text-primary transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
            >
              Back to shop
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-4 text-sm">
          <Link to="/" className="text-tertiary transition-colors duration-snap ease-snap hover:text-accent">
            Home
          </Link>
          <ChevronRight aria-hidden="true" className="h-3 w-3 text-tertiary" />
          <Link to="/shop" className="text-tertiary transition-colors duration-snap ease-snap hover:text-accent">
            Shop
          </Link>
          {product.Category && (
            <>
              <ChevronRight aria-hidden="true" className="h-3 w-3 text-tertiary" />
              <Link
                to={`/${product.Category.slug}`}
                className="text-tertiary transition-colors duration-snap ease-snap hover:text-accent"
              >
                {product.Category.name}
              </Link>
            </>
          )}
          <ChevronRight aria-hidden="true" className="h-3 w-3 text-tertiary" />
          <span className="max-w-[200px] truncate font-bold text-primary">{product.name}</span>
        </nav>

        <div className="rule-section mb-8" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={REVEAL}
            className="space-y-3"
          >
            {/* Main Image */}
            <div className="group relative aspect-square overflow-hidden rounded-card border-2 border-inverse bg-secondary">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  src={images[currentImageIndex] || NO_IMAGE_PLACEHOLDER}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                    className={cn(ICON_BUTTON, "border-inverse bg-card text-primary hover:bg-inverse hover:text-inverse")}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                    className={cn(ICON_BUTTON, "border-inverse bg-card text-primary hover:bg-inverse hover:text-inverse")}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Badges */}
              <div className="absolute left-3 top-3 z-10">
                <ProductBadges product={product} layout="row" />
              </div>

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-tag bg-inverse px-2 py-1 font-display text-[17px] leading-none tabular-nums text-inverse">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Show image ${idx + 1} of ${images.length}`}
                    aria-current={currentImageIndex === idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "h-20 w-20 flex-shrink-0 overflow-hidden rounded-tag border-2 transition duration-snap ease-snap",
                      currentImageIndex === idx
                        ? "border-inverse shadow-hard-sm"
                        : "border-border-primary opacity-70 hover:opacity-100"
                    )}
                  >
                    <img
                      src={img}
                      alt={`${product.name} — view ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...REVEAL, delay: 0.04 }}
            className="flex flex-col"
          >
            {/* Brand & Category */}
            <div className="mb-2 flex flex-wrap items-center gap-3">
              {product.Brand?.name && (
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                  {product.Brand.name}
                </span>
              )}
              {product.Category?.name && (
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                  {product.Category.name}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="font-display text-[clamp(34px,6vw,56px)] font-semibold uppercase leading-[0.92] text-primary">
              {product.name}
            </h1>

            {/* Rating — real stats only; nothing is rendered without reviews */}
            {reviewStats && reviewStats.totalReviews > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      aria-hidden="true"
                      className={cn(
                        "h-4 w-4",
                        i <= Math.round(reviewStats.averageRating)
                          ? "fill-sale text-sale"
                          : "text-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm tabular-nums text-tertiary">
                  {reviewStats.averageRating.toFixed(1)} • {reviewStats.totalReviews}{" "}
                  {reviewStats.totalReviews === 1 ? "review" : "reviews"}
                </span>
                <button
                  type="button"
                  onClick={() => document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="min-h-[44px] text-[11px] font-bold uppercase tracking-[0.12em] text-accent underline"
                >
                  Read reviews
                </button>
              </div>
            )}

            {/* Price — a range until the options that fix a price are chosen */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              {hasVariants && (selectedVariant ? currentPrice > 0 : maxVariantPrice > 0) ? (
                selectedVariant ? (
                  <>
                    <span className="font-display text-[44px] font-semibold leading-none tabular-nums text-primary">
                      Rs {currentPrice.toLocaleString()}
                    </span>
                    {originalPrice > currentPrice && (
                      <>
                        <span className="font-display text-[26px] leading-none tabular-nums text-muted line-through">
                          Rs {originalPrice.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center rounded-tag border-[1.5px] border-sale bg-sale-soft px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-sale">
                          <span className="tabular-nums">{discount}</span>
                          <span className="ml-1">% off</span>
                        </span>
                      </>
                    )}
                  </>
                ) : minVariantPrice !== maxVariantPrice ? (
                  <span className="font-display text-[44px] font-semibold leading-none tabular-nums text-primary">
                    Rs {minVariantPrice.toLocaleString()} – Rs {maxVariantPrice.toLocaleString()}
                  </span>
                ) : (
                  <span className="font-display text-[44px] font-semibold leading-none tabular-nums text-primary">
                    Rs {maxVariantPrice.toLocaleString()}
                  </span>
                )
              ) : (
                <span className="font-display text-[29px] font-semibold uppercase leading-none text-tertiary">
                  Price coming soon
                </span>
              )}
            </div>

            {/* Unavailable Banner */}
            {!isAvailable && (
              <div className="mt-5 flex items-start gap-3 rounded-card border-2 border-sale bg-sale-soft p-3">
                <PackageX aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-sale" />
                <div>
                  <p className="text-sm font-bold text-primary">
                    {hasVariants ? "Currently out of stock" : "Not available yet"}
                  </p>
                  <p className="mt-0.5 text-sm text-primary">
                    {hasVariants
                      ? "All variants are currently sold out. Check back soon."
                      : "This product hasn't been stocked yet. Reach out on WhatsApp for availability."}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-secondary">
                {product.description}
              </p>
            )}

            <div className="my-6 border-t-2 border-border-primary" />

            {/* Size run — the primary selector */}
            {availableSizes.length > 0 && availableSizes[0] !== "One Size" && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                    Select size
                  </span>
                  {selectedSize && (
                    <span className="font-display text-[19px] font-semibold uppercase leading-none tabular-nums text-primary">
                      {selectedSize}
                    </span>
                  )}
                </div>
                <SizeRun
                  sizes={sizeOptions}
                  selected={selectedSize}
                  onSelect={handleSelectSize}
                  boxClassName="min-h-[48px] min-w-[48px] px-3 text-[23px]"
                />
                <p className="mt-2 text-sm text-tertiary">
                  A struck-through box is sold out in that size.
                </p>
              </div>
            )}

            {/* Color Selection */}
            {availableColors.length > 1 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                    Select colour
                  </span>
                  {selectedColor && (
                    <span className="font-display text-[19px] font-semibold uppercase leading-none text-primary">
                      {selectedColor}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableColors.map((color) => {
                    // Narrow colours by the chosen SIZE, not by the chosen
                    // colour. Keying this off selectedColor meant that picking
                    // any colour re-tested every colour against
                    // `v.size === selectedSize`; on a product with no sizes
                    // that compares null to "", so every colour showed as sold
                    // out the moment one was selected.
                    const available = selectedSize
                      ? variants.some(
                          (v) =>
                            v.color === color &&
                            v.size === selectedSize &&
                            isVariantSellable(v)
                        )
                      : variants.some((v) => v.color === color && isVariantSellable(v));
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        disabled={!available}
                        aria-pressed={isSelected}
                        onClick={() => handleSelectColor(color)}
                        className={cn(
                          "min-h-[48px] rounded-tag border-2 px-4 font-display text-[23px] font-semibold uppercase leading-none transition duration-snap ease-snap",
                          isSelected
                            ? "border-inverse bg-inverse text-inverse"
                            : available
                              ? "border-inverse bg-card text-primary hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
                              : "cursor-not-allowed border-border-primary text-muted"
                        )}
                      >
                        {color}
                        {!available && <span className="sr-only">, sold out</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Indicator — hidden until the options resolve a real variant */}
            {!needsSelection && selectedVariant && (
              <p
                className={cn(
                  "mb-5 inline-flex items-center gap-2 self-start rounded-tag border-[1.5px] px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-[0.12em]",
                  inStock ? "border-pitch text-pitch" : "border-accent text-accent"
                )}
              >
                {inStock ? (
                  <>
                    In stock
                    {stockCount !== null && (
                      <span className="tabular-nums">({stockCount})</span>
                    )}
                  </>
                ) : (
                  "Out of stock"
                )}
              </p>
            )}

            {/* Chosen combination does not exist */}
            {combinationUnavailable && (
              <p className="mb-5 flex items-center gap-2 self-start rounded-tag border-[1.5px] border-sale bg-sale-soft px-1.5 py-1 text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-sale">
                <PackageX aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                This combination isn't available — try another size or colour.
              </p>
            )}

            {/* Quantity + Add to Cart */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-tag border-2 border-inverse bg-card">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!canAddToCart || quantity <= 1}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-primary transition duration-snap ease-snap disabled:text-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-display text-[23px] font-semibold leading-none tabular-nums text-primary">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.max(1, Math.min(maxQuantity, q + 1)))}
                  disabled={!canAddToCart || quantity >= maxQuantity}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-primary transition duration-snap ease-snap disabled:text-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={cn(
                  "flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-tag border-2 font-display text-[23px] font-semibold uppercase leading-none transition duration-snap ease-snap",
                  addedToCart
                    ? "border-pitch bg-pitch text-inverse"
                    : canAddToCart
                      ? "border-inverse bg-accent text-inverse hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
                      : "cursor-not-allowed border-border-primary bg-secondary text-muted"
                )}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                    Added to cart
                  </>
                ) : !isAvailable ? (
                  "Unavailable"
                ) : needsSelection ? (
                  "Select options"
                ) : combinationUnavailable ? (
                  "Unavailable"
                ) : !inStock ? (
                  "Out of stock"
                ) : (
                  <>
                    <ShoppingBag aria-hidden="true" className="h-5 w-5" />
                    Add to cart
                  </>
                )}
              </button>

              {/* NOTE: wishlist is local-only state — a backend exists at
                  /api/v1/wishlist but no frontend service calls it yet. */}
              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={isWishlisted}
                className={cn(
                  ICON_BUTTON,
                  isWishlisted
                    ? "border-accent bg-accent text-inverse"
                    : "border-inverse bg-card text-primary hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
                )}
              >
                <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                aria-label={linkCopied ? "Link copied to clipboard" : "Share this product"}
                title={linkCopied ? "Link copied" : "Share"}
                className={cn(
                  ICON_BUTTON,
                  linkCopied
                    ? "border-pitch bg-card text-pitch"
                    : "border-inverse bg-card text-primary hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm"
                )}
              >
                {linkCopied ? <CheckCircle2 className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
              </button>
            </div>

            {/* WhatsApp Order */}
            <a
              href={whatsappUrl(
                `Hi! I'd like to order:\n*${product.name}*${selectedSize ? `\nSize: ${selectedSize}` : ""}${selectedColor ? `\nColor: ${selectedColor}` : ""}\nPrice: Rs ${currentPrice.toLocaleString()}\nQty: ${quantity}\n\nPlease confirm availability.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-tag border-2 border-pitch bg-card font-display text-[23px] font-semibold uppercase leading-none text-pitch transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
            >
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
              Order on WhatsApp
            </a>

            {/* What the shop actually promises */}
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { icon: Truck, label: "Nepal delivery", desc: "2–4 days" },
                { icon: Wallet, label: "Cash on delivery", desc: "Pay at the door" },
                { icon: ShieldCheck, label: "Genuine kit", desc: "Bardibas stock" },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  // Mount-driven: nothing below the fold waits on an observer.
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...REVEAL, delay: idx * 0.04 }}
                  className="flex items-center gap-3 rounded-card border-2 border-border-primary bg-card p-3"
                >
                  <item.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-pitch" />
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                      {item.label}
                    </span>
                    <span className="block text-sm tabular-nums text-tertiary">{item.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div id="reviews-section" className="mt-20">
          <div className="rule-section mb-8" />
          <motion.div
            // Mount-driven: nothing below the fold waits on an observer.
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={REVEAL}
          >
            <p className="eyebrow mb-2">From the shop floor</p>
            <h2 className="mb-8 font-display text-[clamp(34px,6vw,56px)] font-semibold uppercase leading-[0.92] text-primary">
              Customer reviews
            </h2>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {/* key bump forces the list (which only refetches on productId) to reload */}
                <ProductReviews key={`${product.id}-${reviewsVersion}`} productId={product.id} />
              </div>
              <div>
                <WriteReview
                  productId={product.id}
                  onReviewAdded={() => setReviewsVersion((v) => v + 1)}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Similar Products */}
        <div className="mt-20">
          <div className="rule-section mb-8" />
          <Recommendations
            title="You May Also Like"
            subtitle="Similar products from this category"
            filter={{ categoryId: product.categoryId, limit: 4 }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
