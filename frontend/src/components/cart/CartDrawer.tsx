import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart, type CartItem } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import { pickProductImageUrl } from "../../utils/placeholder";

/** Icon-only controls hold the 44px floor (WCAG 2.5.5). */
const ICON_BUTTON =
  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-tag border-2 transition duration-snap ease-snap";

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
          {/* Backdrop — a plain ink scrim, no blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 z-[100] bg-inverse/60"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.12, ease: [0.2, 0.7, 0.3, 1] }}
            className="fixed bottom-0 right-0 top-0 z-[110] flex w-full flex-col border-l-2 border-inverse bg-primary sm:w-[420px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b-[3px] border-inverse p-4">
              <div className="min-w-0">
                <p className="eyebrow">Your cart</p>
                <h2 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
                  <span className="tabular-nums">{cart.length}</span> item
                  {cart.length !== 1 ? "s" : ""}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
                className={cn(ICON_BUTTON, "border-inverse bg-card text-primary")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
                  <ShoppingBag aria-hidden="true" className="h-10 w-10 text-tertiary" />
                  <div>
                    <h3 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
                      Cart is empty
                    </h3>
                    <p className="mt-1 text-sm text-tertiary">
                      Jerseys, boots, balls and bats are a tap away.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/shop");
                    }}
                    className="min-h-[44px] rounded-tag border-2 border-inverse bg-accent px-6 font-display text-[19px] font-semibold uppercase leading-none text-inverse transition duration-snap ease-snap hover:bg-accent-hover"
                  >
                    Browse the shop
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
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
                    className="flex gap-3 rounded-card border-2 border-inverse bg-card p-2"
                  >
                    {/* Image */}
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-tag border-2 border-border-primary bg-secondary">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={pickProductImageUrl(item.images)}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-tertiary">
                          <ShoppingBag aria-hidden="true" className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="truncate font-display text-[23px] font-semibold uppercase leading-none text-primary">
                            {item.name}
                          </h4>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {item.selectedSize && (
                              <span className="inline-flex items-center rounded-tag border-[1.5px] border-border-primary px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-tertiary">
                                Size{" "}
                                <span className="ml-1 tabular-nums">
                                  {item.selectedSize}
                                </span>
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="inline-flex items-center rounded-tag border-[1.5px] border-border-primary px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-tertiary">
                                {item.selectedColor}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.variantId)}
                          aria-label={`Remove ${item.name} from cart`}
                          className={cn(
                            ICON_BUTTON,
                            "shrink-0 border-border-primary text-tertiary hover:border-accent hover:text-accent"
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-tag border-2 border-inverse">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.variantId, item.quantity - 1)
                            }
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-primary transition duration-snap ease-snap"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center font-display text-[19px] font-semibold leading-none tabular-nums text-primary">
                            {item.quantity}
                          </span>
                          {/* Clamped to stock — see Cart.tsx. */}
                          <button
                            type="button"
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
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-primary transition duration-snap ease-snap disabled:text-muted"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="font-display text-[23px] font-semibold leading-none tabular-nums text-primary">
                          Rs{" "}
                          {((item.variantPrice || item.price || 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>

                      {availableStock !== null && (atStockCap || availableStock <= 5) && (
                        <p
                          className={cn(
                            "mt-1 text-[11px] font-bold uppercase tracking-[0.12em]",
                            atStockCap ? "text-marigold" : "text-tertiary"
                          )}
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
              <div className="space-y-3 border-t-[3px] border-inverse p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                    Subtotal
                  </p>
                  <p className="font-display text-[29px] font-semibold leading-none tabular-nums text-primary">
                    Rs {cartTotal.toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-tertiary">
                  Shipping calculated at checkout. COD available all over Nepal.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/cart");
                    }}
                    className="min-h-[48px] flex-1 rounded-tag border-2 border-inverse bg-card font-display text-[19px] font-semibold uppercase leading-none text-primary transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
                  >
                    View cart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/checkout");
                    }}
                    className="flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-tag border-2 border-inverse bg-accent font-display text-[19px] font-semibold uppercase leading-none text-inverse transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
                  >
                    Checkout <ArrowRight aria-hidden="true" className="h-4 w-4" />
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
