import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";

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
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-stone-950 text-white z-[110] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-stone-900/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-black uppercase tracking-tighter italic">
                  Your <span className="text-orange-600">Locker</span>
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-orange-600/20">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-widest text-white italic">
                      Locker is Empty
                    </h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-[200px]">
                      No elite gear added yet. Start your journey.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/shop");
                    }}
                    className="px-8 py-3 bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95 shadow-xl shadow-orange-600/20"
                  >
                    Go Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.variantId || item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 rounded-2xl p-4 border border-white/5 flex gap-4 group"
                  >
                    <div className="w-20 h-24 bg-stone-900 rounded-xl overflow-hidden shrink-0">
                      {item.ProductImages && item.ProductImages.length > 0 ? (
                        <img
                          src={item.ProductImages.find(img => img.isThumbnail)?.url || item.ProductImages[0].url}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold text-[10px] uppercase">
                          No Pic
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 italic">
                            {item.Brand?.name || "Premium Gear"}
                          </p>
                          <h4 className="font-black text-sm uppercase tracking-tighter italic line-clamp-1">
                            {item.name}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.selectedSize && (
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Size:{" "}
                                <span className="text-white">
                                  {item.selectedSize}
                                </span>
                              </p>
                            )}
                            {item.selectedColor && (
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Color:{" "}
                                <span className="text-white">
                                  {item.selectedColor}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            removeFromCart(item.id, item.variantId)
                          }
                          className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 bg-stone-900 rounded-lg p-1 border border-white/5">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.variantId,
                                item.quantity - 1,
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center bg-stone-800 rounded-md text-gray-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.variantId,
                                item.quantity + 1,
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center bg-stone-800 rounded-md text-gray-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="font-black text-sm text-white italic">
                          Rs{" "}
                          {(
                            (item.variantPrice || item.price || 0) *
                            item.quantity
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 bg-stone-900/80 backdrop-blur-xl border-t border-white/10 space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest italic">
                    Kit Total
                  </p>
                  <p className="text-3xl font-black text-white uppercase italic tracking-tighter">
                    Rs {cartTotal.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/cart");
                    }}
                    className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                  >
                    Full View
                  </button>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/checkout");
                    }}
                    className="flex-[2] py-4 bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95 shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2"
                  >
                    Quick Buy <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 text-center font-bold uppercase tracking-widest">
                  Secure Elite Checkout - Powered by Resend
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
