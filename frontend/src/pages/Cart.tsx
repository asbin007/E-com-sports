import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { useCart, type CartItem } from "../context/CartContext";
import { pickProductImageUrl } from "../utils/placeholder";

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

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-4 pb-12 flex flex-col items-center justify-center bg-primary text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-secondary rounded-3xl flex items-center justify-center mx-auto border border-border-primary">
            <ShoppingBag className="w-12 h-12 text-muted" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-primary mb-3"
        >
          Your cart is empty
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-tertiary mb-8 max-w-sm text-sm leading-relaxed"
        >
          Looks like you haven't added any products yet. Browse our collection to find something you'll love.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            to="/shop"
            className="flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-2xl font-bold text-sm hover:bg-accent-hover transition-all active:scale-95 shadow-xl shadow-accent/20"
          >
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pt-4 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between py-8 gap-4 border-b border-border-primary"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-primary">
              Shopping Cart
            </h1>
            <p className="text-sm text-tertiary mt-1">
              {cart.length} item{cart.length !== 1 ? "s" : ""} in your cart
            </p>
          </div>
          <Link
            to="/shop"
            className="flex items-center gap-1 text-sm font-bold text-accent hover:text-accent-hover transition-colors group"
          >
            Continue Shopping
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.map((item, idx) => {
                const availableStock = getAvailableStock(item);
                const atStockCap =
                  availableStock !== null && item.quantity >= availableStock;
                return (
                <motion.div
                  key={item.variantId || item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card rounded-2xl p-4 sm:p-6 border border-border-primary flex flex-col sm:flex-row gap-4 sm:gap-6 hover:shadow-lg hover:border-accent/20 transition-all duration-300"
                >
                  {/* Image */}
                  <Link
                    to={`/product/${item.id}`}
                    className="w-full sm:w-32 h-36 sm:h-32 bg-secondary rounded-xl overflow-hidden flex-shrink-0 group"
                  >
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={pickProductImageUrl(item.images)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">
                          {item.Brand?.name || "Sports Gear"}
                        </p>
                        <Link
                          to={`/product/${item.id}`}
                          className="text-base font-bold text-primary line-clamp-1 hover:text-accent transition-colors"
                        >
                          {item.name}
                        </Link>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.selectedSize && (
                            <span className="text-xs text-tertiary bg-secondary px-2.5 py-1 rounded-lg border border-border-primary">
                              Size: <span className="font-bold text-primary">{item.selectedSize}</span>
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="text-xs text-tertiary bg-secondary px-2.5 py-1 rounded-lg border border-border-primary">
                              Color: <span className="font-bold text-primary capitalize">{item.selectedColor}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeFromCart(item.id, item.variantId)}
                        className="p-2.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all flex-shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      {/* Quantity */}
                      <div>
                        <div className="flex items-center bg-secondary rounded-xl border border-border-primary">
                          <button
                            onClick={() => updateQuantity(item.id, item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary transition-colors disabled:opacity-30"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center text-sm font-bold text-primary">
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
                            className="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {availableStock !== null && (atStockCap || availableStock <= 5) && (
                          <p
                            className={`text-[10px] mt-1.5 font-medium ${
                              atStockCap ? "text-amber-600" : "text-muted"
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
                        <p className="text-xl font-black text-primary">
                          Rs {((item.variantPrice || item.price || 0) * item.quantity).toLocaleString()}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-muted">
                            Rs {(item.variantPrice || item.price || 0).toLocaleString()} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Trust Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              {[
                { icon: Truck, label: "Fast Delivery", desc: "All over Nepal", color: "text-blue-500" },
                { icon: ShieldCheck, label: "100% Authentic", desc: "Genuine products only", color: "text-emerald-500" },
                { icon: RotateCcw, label: "Easy Returns", desc: "7-day return policy", color: "text-purple-500" },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-center gap-3 p-4 bg-secondary rounded-2xl border border-border-primary hover:border-accent/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">{item.label}</p>
                    <p className="text-[10px] text-muted">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-3xl p-6 border border-border-primary sticky top-28 shadow-lg"
            >
              <h2 className="text-lg font-bold text-primary mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Subtotal ({cart.length} items)</span>
                  <span className="font-semibold text-primary">Rs {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Shipping</span>
                  <span className="font-semibold text-primary">Calculated at checkout</span>
                </div>
                <div className="border-t border-border-primary pt-4">
                  <div className="flex justify-between">
                    <span className="font-bold text-primary">Subtotal</span>
                    <span className="text-2xl font-black text-primary">
                      Rs {cartTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate("/checkout")}
                className="w-full py-4 bg-accent text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-xl shadow-accent/20 hover:bg-accent-hover transition-all flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <p className="text-[10px] text-muted text-center mt-4">
                Secure checkout • Delivery charge shown at checkout
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
