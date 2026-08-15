import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart, type CartItem } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { pickProductImageUrl } from "../../utils/placeholder";

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

const CartDrawer = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
  } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-primary z-[110] flex flex-col shadow-2xl border-l border-border-primary"
          >
            {/* Header */}
            <div className="p-5 border-b border-border-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary">Your Cart</h2>
                  <p className="text-xs text-muted">{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-surface-hover rounded-xl transition-colors text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                  <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-muted" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary">Cart is empty</h3>
                    <p className="text-sm text-tertiary mt-1">
                      Add some products to get started
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/shop");
                    }}
                    className="px-6 py-2.5 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent-hover transition-all active:scale-95"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const availableStock = getAvailableStock(item);
                  const atStockCap =
                    availableStock !== null && item.quantity >= availableStock;
                  return (
                  <motion.div
                    key={item.variantId || item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary rounded-xl p-3 border border-border-primary flex gap-3 group"
                  >
                    {/* Image */}
                    <div className="w-18 h-20 bg-tertiary rounded-lg overflow-hidden shrink-0">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={pickProductImageUrl(item.images)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-primary truncate">
                            {item.name}
                          </h4>
                          <div className="flex gap-2 mt-0.5">
                            {item.selectedSize && (
                              <span className="text-[10px] font-medium text-tertiary">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="text-[10px] font-medium text-tertiary">
                                Color: {item.selectedColor}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.variantId)}
                          className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2 bg-primary rounded-lg p-0.5 border border-border-primary">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.variantId, item.quantity - 1)
                            }
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-secondary hover:bg-surface-hover transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-primary w-4 text-center">
                            {item.quantity}
                          </span>
                          {/* Clamped to stock — see Cart.tsx. */}
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
                            className="w-6 h-6 flex items-center justify-center rounded-md text-secondary hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="font-bold text-sm text-primary">
                          Rs {((item.variantPrice || item.price || 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>

                      {availableStock !== null && (atStockCap || availableStock <= 5) && (
                        <p
                          className={`text-[10px] mt-1 font-medium ${
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
                  </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-border-primary space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-secondary font-medium">Subtotal</p>
                  <p className="text-xl font-black text-primary">
                    Rs {cartTotal.toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-muted">Shipping calculated at checkout</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/cart");
                    }}
                    className="flex-1 py-3 bg-secondary border border-border-primary text-primary rounded-xl font-semibold text-sm hover:bg-surface-hover transition-all active:scale-95"
                  >
                    View Cart
                  </button>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/checkout");
                    }}
                    className="flex-[2] py-3 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                  >
                    Checkout <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
