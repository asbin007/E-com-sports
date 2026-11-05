import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Truck,
  Banknote,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { useCart, type CartItem } from "../context/CartContext";
import { pickProductImageUrl } from "../utils/placeholder";

const CHIP =
  "rounded-tag border-[1.5px] border-border-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary";
const STEPPER =
  "flex h-11 w-11 items-center justify-center text-primary transition-colors duration-snap ease-snap hover:bg-surface-hover disabled:text-muted disabled:hover:bg-transparent disabled:cursor-not-allowed";
const BTN_PRIMARY =
  "flex w-full items-center justify-center gap-2 rounded-tag border-2 border-inverse bg-accent py-3 font-display text-xl uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";

/**
 * Stock available for what is actually in the cart. Returns null when the item
 * carries no variant data (older carts restored from localStorage), in which
 * case we cannot clamp and leave the control unbounded.
 */
function getAvailableStock(item: CartItem): number | null {
  const variants = item.variants;
  if (!variants || variants.length === 0) return null;
  if (item.variantId) {
    const match = variants.find((v) => v.id === item.variantId);
    return typeof match?.stock === "number" ? match.stock : null;
  }
  return variants.reduce(
    (sum, v) => sum + (typeof v.stock === "number" ? v.stock : 0),
    0
  );
}

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const rise = reduce ? false : { opacity: 0, y: 12 };
  const snap: Transition = { duration: 0.16, ease: [0.2, 0.7, 0.3, 1] };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-4 pb-12 flex flex-col items-center justify-center bg-primary px-4 text-center">
        <motion.div
          initial={rise}
          animate={{ opacity: 1, y: 0 }}
          transition={snap}
          className="mb-8"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-card border-2 border-inverse bg-card">
            <ShoppingBag className="h-12 w-12 text-tertiary" aria-hidden="true" />
          </div>
        </motion.div>

        <motion.h1
          initial={rise}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...snap, delay: 0.04 }}
          className="mb-3 font-display text-[34px] font-semibold uppercase leading-none text-primary"
        >
          Your cart is empty
        </motion.h1>
        <motion.p
          initial={rise}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...snap, delay: 0.08 }}
          className="mb-8 max-w-sm text-sm leading-relaxed text-tertiary"
        >
          No kit in the cart yet. Browse jerseys, footballs, bats and boots — COD available,
          delivery all over Nepal.
        </motion.p>

        <motion.div
          initial={rise}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...snap, delay: 0.12 }}
        >
          <Link
            to="/shop"
            className="flex items-center gap-2 rounded-tag border-2 border-inverse bg-accent px-8 py-3 font-display text-xl uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            Browse Products
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pt-4 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b-[3px] border-inverse py-8 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow mb-2">Your kit bag</p>
            <h1 className="font-display text-[34px] font-semibold uppercase leading-none text-primary md:text-[44px]">
              Shopping Cart
            </h1>
            <p className="mt-1 text-sm text-tertiary tabular-nums">
              {cart.length} item{cart.length !== 1 ? "s" : ""} in your cart
            </p>
          </div>
          <Link
            to="/shop"
            className="group flex min-h-[44px] items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent transition-colors duration-snap ease-snap hover:text-accent-hover"
          >
            Continue Shopping
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-8">
            <AnimatePresence mode="popLayout">
              {cart.map((item, idx) => {
                const availableStock = getAvailableStock(item);
                const atStockCap =
                  availableStock !== null && item.quantity >= availableStock;
                const unitPrice = item.variantPrice || item.price || 0;
                return (
                <motion.div
                  key={item.variantId || item.id}
                  layout
                  initial={rise}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ ...snap, delay: idx * 0.04 }}
                >
                  {/* The lift lives on this inner element: framer owns the
                      transform on the motion wrapper above. */}
                  <div className="flex flex-col gap-4 rounded-card border-2 border-inverse bg-card p-4 transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard sm:flex-row sm:gap-6 sm:p-6">
                  {/* Image */}
                  <Link
                    to={`/product/${item.id}`}
                    className="h-36 w-full flex-shrink-0 overflow-hidden rounded-tag border-2 border-inverse bg-secondary sm:h-32 sm:w-32"
                  >
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={pickProductImageUrl(item.images)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-tertiary">
                        <ShoppingBag className="h-8 w-8" aria-hidden="true" />
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                          {item.Brand?.name || "Sports Gear"}
                        </p>
                        <Link
                          to={`/product/${item.id}`}
                          className="line-clamp-1 font-display text-[29px] font-semibold uppercase leading-none text-primary transition-colors duration-snap ease-snap hover:text-accent"
                        >
                          {item.name}
                        </Link>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.selectedSize && (
                            <span className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-tag border-2 border-inverse px-2 font-display text-base font-semibold uppercase leading-none tabular-nums text-primary">
                              {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className={CHIP}>{item.selectedColor}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.variantId)}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-tag text-tertiary transition-colors duration-snap ease-snap hover:bg-surface-hover hover:text-accent"
                        title="Remove item"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {/* Quantity */}
                      <div>
                        <div className="flex items-center rounded-tag border-2 border-inverse bg-card">
                          <button
                            onClick={() => updateQuantity(item.id, item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className={STEPPER}
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <span className="w-11 text-center font-display text-lg font-semibold leading-none tabular-nums text-primary">
                            {item.quantity}
                          </span>
                          {/* Clamped to stock: raising the quantity past what
                              exists only surfaces as a 400 after the customer
                              has already paid the total by QR. */}
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.variantId,
                                availableStock === null
                                  ? item.quantity + 1
                                  : Math.min(item.quantity + 1, availableStock)
                              )
                            }
                            disabled={atStockCap}
                            aria-label={`Increase quantity of ${item.name}`}
                            className={STEPPER}
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        {availableStock !== null && (atStockCap || availableStock <= 5) && (
                          <p
                            className={`mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums ${
                              atStockCap ? "text-sale" : "text-tertiary"
                            }`}
                          >
                            {availableStock === 0
                              ? "Out of stock"
                              : atStockCap
                                ? `Max available — only ${availableStock} in stock`
                                : `Only ${availableStock} left`}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-display text-[29px] font-semibold leading-none tabular-nums text-primary">
                          Rs {(unitPrice * item.quantity).toLocaleString()}
                        </p>
                        {item.quantity > 1 && (
                          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-tertiary">
                            Rs {unitPrice.toLocaleString()} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>

            {/* What the shop actually offers */}
            <div className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-3">
              {[
                { icon: Truck, label: "Delivery", desc: "All over Nepal" },
                { icon: Banknote, label: "COD available", desc: "Pay on delivery" },
                { icon: MapPin, label: "Bardibas", desc: "Chaudhary Market" },
              ].map((feature, idx) => (
                <motion.div
                  key={feature.label}
                  initial={rise}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...snap, delay: 0.12 + idx * 0.04 }}
                >
                  <div className="flex items-center gap-3 rounded-card border-2 border-inverse bg-card p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-tag border-2 border-inverse bg-sale-soft">
                      <feature.icon className="h-5 w-5 text-sale" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-display text-lg font-semibold uppercase leading-none text-primary">
                        {feature.label}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Order Summary — printed receipt */}
          <div className="lg:col-span-4">
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={snap}
              className="sticky top-28 rounded-card border-2 border-inverse bg-card p-6"
            >
              <p className="eyebrow mb-4">Receipt</p>
              <h2 className="mb-6 font-display text-[29px] font-semibold uppercase leading-none text-primary">
                Order Summary
              </h2>

              <dl className="mb-6">
                <div className="flex items-baseline justify-between border-b border-border-primary py-2.5 text-sm">
                  <dt className="text-tertiary tabular-nums">Subtotal ({cart.length} items)</dt>
                  <dd className="font-display text-lg font-semibold leading-none tabular-nums text-primary">
                    Rs {cartTotal.toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-b border-border-primary py-2.5 text-sm">
                  <dt className="text-tertiary">Delivery charge</dt>
                  <dd className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                    At checkout
                  </dd>
                </div>
                <div className="mt-0 flex items-baseline justify-between border-t-2 border-inverse pt-3">
                  <dt className="font-display text-xl font-semibold uppercase leading-none text-primary">
                    Subtotal
                  </dt>
                  <dd className="font-display text-[34px] font-semibold leading-none tabular-nums text-primary">
                    Rs {cartTotal.toLocaleString()}
                  </dd>
                </div>
              </dl>

              <button type="button" onClick={() => navigate("/checkout")} className={BTN_PRIMARY}>
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                COD available · Delivery charge shown at checkout
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
