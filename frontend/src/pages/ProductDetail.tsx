import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { productService, type Product } from "../services/productService";
import { reviewService, type ReviewStats } from "../services/reviewService";
import { useCart } from "../context/CartContext";
import { cn } from "../utils/cn";
import { NO_IMAGE_PLACEHOLDER } from "../utils/placeholder";
import ProductBadges from "../components/product/ProductBadges";
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

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();

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
  const isAvailable = hasVariants && variants.some((v) => v.isActive !== false && v.stock > 0);

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
  const inStock = selectedVariant ? selectedVariant.stock > 0 : isAvailable;
  const stockCount = selectedVariant?.stock || 0;
  const discount = originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  // Options are chosen but no such variant exists (e.g. size L never made in Red).
  const combinationUnavailable = !needsSelection && hasVariants && !selectedVariant;
  const canAddToCart =
    hasVariants && isAvailable && !needsSelection && !!selectedVariant && selectedVariant.stock > 0;
  const maxQuantity = selectedVariant?.stock ?? 0;

  // Re-clamp quantity whenever the resolved variant (and therefore its stock) changes.
  const clampQuantityFor = (size: string, color: string) => {
    const stock = findVariant(size, color)?.stock ?? 0;
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

    const qty = Math.max(1, Math.min(quantity, selectedVariant.stock));
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

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (loadError || !product) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center p-8 rounded-3xl bg-card border border-border-primary shadow-lg"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-primary">Couldn't load this product</h1>
          <p className="text-sm text-tertiary mt-2">
            Something went wrong while fetching this product. Please check your connection and try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={fetchProduct}
              className="flex-1 h-12 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try again
            </button>
            <Link
              to="/shop"
              className="flex-1 h-12 rounded-xl border border-border-primary text-primary font-bold text-sm hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
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
      <div className="max-w-[1440px] mx-auto pt-4 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm py-4 mb-6"
        >
          <Link to="/" className="text-muted hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-muted" />
          <Link to="/shop" className="text-muted hover:text-accent transition-colors">Shop</Link>
          {product.Category && (
            <>
              <ChevronRight className="w-3 h-3 text-muted" />
              <Link to={`/${product.Category.slug}`} className="text-muted hover:text-accent transition-colors">
                {product.Category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-muted" />
          <span className="text-primary font-medium truncate max-w-[200px]">{product.name}</span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="relative aspect-square bg-secondary rounded-3xl overflow-hidden group border border-border-primary shadow-lg">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  src={images[currentImageIndex] || NO_IMAGE_PLACEHOLDER}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </AnimatePresence>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                    className="p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg text-gray-800 hover:bg-accent hover:text-white transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                    className="p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg text-gray-800 hover:bg-accent hover:text-white transition-all active:scale-95"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 z-10">
                <ProductBadges product={product} layout="row" />
              </div>

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Show image ${idx + 1} of ${images.length}`}
                    aria-current={currentImageIndex === idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all",
                      currentImageIndex === idx
                        ? "border-accent shadow-lg shadow-accent/20"
                        : "border-border-primary opacity-60 hover:opacity-100 hover:border-accent/50"
                    )}
                  >
                    <img
                      src={img}
                      alt={`${product.name} — view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Brand & Category */}
            <div className="flex items-center gap-3 flex-wrap mb-3">
              {product.Brand?.name && (
                <span className="text-xs font-bold text-accent uppercase tracking-wider px-2.5 py-1 bg-accent/10 rounded-lg">
                  {product.Brand.name}
                </span>
              )}
              {product.Category?.name && (
                <span className="text-xs text-muted font-medium">
                  {product.Category.name}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-primary leading-tight">
              {product.name}
            </h1>

            {/* Rating — real stats only; nothing is rendered without reviews */}
            {reviewStats && reviewStats.totalReviews > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i <= Math.round(reviewStats.averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted font-medium">
                  ({reviewStats.averageRating.toFixed(1)} • {reviewStats.totalReviews}{" "}
                  {reviewStats.totalReviews === 1 ? "review" : "reviews"})
                </span>
                <button
                  onClick={() => document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-xs text-accent font-medium hover:underline"
                >
                  Read reviews
                </button>
              </div>
            )}

            {/* Price — a range until the options that fix a price are chosen */}
            <div className="flex items-baseline gap-3 mt-5">
              {hasVariants && (selectedVariant ? currentPrice > 0 : maxVariantPrice > 0) ? (
                selectedVariant ? (
                  <>
                    <span className="text-3xl font-black text-primary">Rs {currentPrice.toLocaleString()}</span>
                    {originalPrice > currentPrice && (
                      <>
                        <span className="text-lg text-muted line-through">Rs {originalPrice.toLocaleString()}</span>
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                          {discount}% OFF
                        </span>
                      </>
                    )}
                  </>
                ) : minVariantPrice !== maxVariantPrice ? (
                  <span className="text-3xl font-black text-primary">
                    Rs {minVariantPrice.toLocaleString()} – Rs {maxVariantPrice.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-3xl font-black text-primary">Rs {maxVariantPrice.toLocaleString()}</span>
                )
              ) : (
                <span className="text-xl font-bold text-muted">Price coming soon</span>
              )}
            </div>

            {/* Unavailable Banner */}
            {!isAvailable && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3"
              >
                <PackageX className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-primary">
                    {hasVariants ? "Currently out of stock" : "Not available yet"}
                  </p>
                  <p className="text-xs text-tertiary mt-0.5">
                    {hasVariants
                      ? "All variants are currently sold out. Check back soon."
                      : "This product hasn't been stocked yet. Reach out on WhatsApp for availability."}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-sm text-tertiary leading-relaxed mt-5">{product.description}</p>
            )}

            <div className="border-t border-border-primary my-6" />

            {/* Size Selection */}
            {availableSizes.length > 0 && availableSizes[0] !== "One Size" && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-primary">Select Size</span>
                  {selectedSize && (
                    <span className="text-xs text-accent font-semibold bg-accent/10 px-2 py-1 rounded-lg">
                      {selectedSize}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {availableSizes.map((size) => {
                    const available = selectedColor
                      ? variants.some((v) => v.size === size && v.color === selectedColor && v.stock > 0)
                      : variants.some((v) => v.size === size && v.stock > 0);
                    return (
                      <button
                        key={size}
                        disabled={!available}
                        onClick={() => handleSelectSize(size)}
                        className={cn(
                          "min-w-[48px] h-12 px-4 rounded-xl text-sm font-bold border-2 transition-all",
                          selectedSize === size
                            ? "bg-accent border-accent text-white shadow-lg shadow-accent/20"
                            : available
                              ? "bg-secondary border-border-primary text-primary hover:border-accent/50"
                              : "bg-secondary border-border-primary text-muted opacity-40 cursor-not-allowed line-through"
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {availableColors.length > 1 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-primary">Select Color</span>
                  {selectedColor && (
                    <span className="text-xs text-accent font-semibold capitalize bg-accent/10 px-2 py-1 rounded-lg">
                      {selectedColor}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {availableColors.map((color) => {
                    const available = selectedSize
                      ? variants.some((v) => v.color === color && v.size === selectedSize && v.stock > 0)
                      : variants.some((v) => v.color === color && v.stock > 0);
                    return (
                      <button
                        key={color}
                        disabled={!available}
                        onClick={() => handleSelectColor(color)}
                        className={cn(
                          "px-5 h-11 rounded-xl text-sm font-bold border-2 transition-all capitalize",
                          selectedColor === color
                            ? "bg-accent border-accent text-white shadow-lg shadow-accent/20"
                            : available
                              ? "bg-secondary border-border-primary text-primary hover:border-accent/50"
                              : "bg-secondary border-border-primary text-muted opacity-40 cursor-not-allowed"
                        )}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Indicator — hidden until the options resolve a real variant */}
            {!needsSelection && selectedVariant && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "flex items-center gap-2 text-xs font-semibold mb-5 px-3 py-2 rounded-xl",
                  inStock ? "text-emerald-600 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", inStock ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                {inStock ? `In stock (${stockCount} available)` : "Out of stock"}
              </motion.div>
            )}

            {/* Chosen combination does not exist */}
            {combinationUnavailable && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs font-semibold mb-5 px-3 py-2 rounded-xl text-amber-600 bg-amber-500/10"
              >
                <PackageX className="w-4 h-4 shrink-0" />
                This combination isn't available. Try another size or color.
              </motion.div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center bg-secondary border border-border-primary rounded-xl">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!canAddToCart || quantity <= 1}
                  className="w-11 h-11 flex items-center justify-center text-secondary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-primary">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.max(1, Math.min(maxQuantity, q + 1)))}
                  disabled={!canAddToCart || quantity >= maxQuantity}
                  className="w-11 h-11 flex items-center justify-center text-secondary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={cn(
                  "flex-1 h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                  addedToCart
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : canAddToCart
                      ? "bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20"
                      : "bg-secondary text-muted cursor-not-allowed border border-border-primary"
                )}
              >
                <AnimatePresence mode="wait">
                  {addedToCart ? (
                    <motion.div
                      key="added"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Added to Cart!
                    </motion.div>
                  ) : !isAvailable ? (
                    <span key="unavailable">Unavailable</span>
                  ) : needsSelection ? (
                    <span key="select">Select Options</span>
                  ) : combinationUnavailable ? (
                    <span key="nocombo">Unavailable</span>
                  ) : !inStock ? (
                    <span key="outofstock">Out of Stock</span>
                  ) : (
                    <motion.div key="addtocart" className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* NOTE: wishlist is local-only state — a backend exists at
                  /api/v1/wishlist but no frontend service calls it yet. */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={isWishlisted}
                className={cn(
                  "w-12 h-12 border-2 rounded-xl flex items-center justify-center transition-all",
                  isWishlisted
                    ? "bg-red-500 border-red-500 text-white"
                    : "border-border-primary text-secondary hover:text-red-500 hover:border-red-500"
                )}
              >
                <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                aria-label={linkCopied ? "Link copied to clipboard" : "Share this product"}
                title={linkCopied ? "Link copied!" : "Share"}
                className={cn(
                  "w-12 h-12 border-2 rounded-xl flex items-center justify-center transition-all",
                  linkCopied
                    ? "border-emerald-500 text-emerald-500"
                    : "border-border-primary text-secondary hover:text-accent hover:border-accent"
                )}
              >
                {linkCopied ? <CheckCircle2 className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              </motion.button>
            </div>

            {/* WhatsApp Order */}
            <motion.a
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "9779748477628"}?text=${encodeURIComponent(
                `Hi! I'd like to order:\n*${product.name}*${selectedSize ? `\nSize: ${selectedSize}` : ""}${selectedColor ? `\nColor: ${selectedColor}` : ""}\nPrice: Rs ${currentPrice.toLocaleString()}\nQty: ${quantity}\n\nPlease confirm availability.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl text-sm font-bold border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Order via WhatsApp
            </motion.a>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { icon: Truck, label: "Nepal Delivery", desc: "2-4 days" },
                { icon: ShieldCheck, label: "Genuine Product", desc: "100% authentic" },
                { icon: MessageCircle, label: "24/7 Support", desc: "WhatsApp" },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex flex-col items-center text-center gap-2 p-4 bg-secondary rounded-2xl border border-border-primary hover:border-accent/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-primary block">{item.label}</span>
                    <span className="text-[10px] text-muted">{item.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div id="reviews-section" className="mt-20 pt-10 border-t border-border-primary">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-primary mb-8">Customer Reviews</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
        <div className="mt-20 pt-10 border-t border-border-primary">
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
