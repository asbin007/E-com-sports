import { useEffect } from "react";
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
  Clock,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { gsap } from "gsap";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Basic entry animation for cart content
    gsap.from(".cart-item", {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 0.6,
      ease: "power3.out",
    });
  }, [cart.length]);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-12 flex flex-col items-center justify-center bg-white text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className="relative mb-12"
        >
          <div className="absolute inset-0 bg-orange-600/20 blur-[80px] rounded-full" />
          <div className="w-32 h-32 bg-stone-950 rounded-[2.5rem] flex items-center justify-center relative shadow-2xl border border-white/10">
            <ShoppingBag className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <h2 className="text-5xl font-black text-stone-950 uppercase tracking-tighter italic mb-4">
          Locker is Empty
        </h2>
        <p className="text-gray-500 mb-10 max-w-sm font-bold uppercase tracking-widest text-xs leading-relaxed">
          The equipment shed is currently clear. Rack up some elite gear to
          start your performance journey.
        </p>

        <Link
          to="/shop"
          className="group flex items-center gap-3 px-12 py-5 bg-stone-950 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-orange-600 transition-all active:scale-95 italic"
        >
          Explore Drops
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] italic">
                Brothers Shoe Locker
              </span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                Review Gear
              </span>
            </div>
            <h1 className="text-6xl font-black text-stone-950 tracking-tighter uppercase italic leading-none">
              Your <span className="text-orange-600">Equipment</span>
            </h1>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            {cart.length} Unit{cart.length !== 1 ? "s" : ""} Prepared for
            Deployment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Cart Items Area */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div
                  key={`${item.id}-${item.selectedSize}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="cart-item group relative bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-8 hover:shadow-xl hover:border-orange-600/20 transition-all duration-500 overflow-hidden"
                >
                  {/* Item Image */}
                  <div className="w-full sm:w-44 h-48 bg-stone-50 rounded-[1.5rem] overflow-hidden flex-shrink-0 relative group-hover:bg-white transition-colors duration-500">
                    {item.images && item.images[0] ? (
                      <img
                        src={
                          item.images[0].startsWith("http")
                            ? item.images[0]
                            : `https://res.cloudinary.com/dxpe7jikz/image/upload/v1/${item.images[0].replace(
                                "/uploads/",
                                "",
                              )}`
                        }
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-black text-xs uppercase tracking-widest italic">
                        No Data
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <div className="bg-stone-950/80 backdrop-blur text-white p-2 rounded-lg scale-0 group-hover:scale-100 transition-transform">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 italic">
                            {item.Brand?.name || "Global Elite"}
                          </p>
                          <h3 className="text-3xl font-black text-stone-950 uppercase tracking-tighter italic leading-tight group-hover:text-orange-600 transition-colors">
                            {item.name}
                          </h3>
                        </div>
                        <button
                          onClick={() =>
                            removeFromCart(item.id, item.selectedSize)
                          }
                          className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          title="Eject unit"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            Dimension
                          </span>
                          <span className="text-[11px] font-black text-stone-950 uppercase">
                            {item.selectedSize}
                          </span>
                        </div>
                        <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            Status
                          </span>
                          <span className="text-[11px] font-black text-green-600 uppercase italic">
                            Authenticated
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-8">
                      <div className="flex items-center gap-4 bg-stone-50 rounded-2xl p-1.5 border border-gray-100">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.selectedSize,
                              item.quantity - 1,
                            )
                          }
                          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-stone-950 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all active:scale-90 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-stone-950"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-black text-lg text-stone-950 w-6 text-center italic">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.selectedSize,
                              item.quantity + 1,
                            )
                          }
                          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-stone-950 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all active:scale-90"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">
                          Subtotal
                        </p>
                        <p className="text-3xl font-black text-stone-950 italic tracking-tighter">
                          Rs{" "}
                          {(
                            (item.price || 5999) * item.quantity
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-gray-50">
              <div className="flex gap-4 p-6 bg-stone-50 rounded-[2rem] border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-950 mb-1 italic">
                    Fast Deployment
                  </h4>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                    Free nationwide shipping on elite gear
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-6 bg-white rounded-[2rem] border border-gray-100">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-stone-950" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-950 mb-1 italic">
                    Secure Vault
                  </h4>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                    Advanced data protection & trust
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-6 bg-stone-50 rounded-[2rem] border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-950 mb-1 italic">
                    24/7 Support
                  </h4>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                    Elite assistance for every athlete
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Sticky Area */}
          <div className="lg:col-span-4">
            <div className="bg-stone-950 text-white rounded-[3rem] p-10 shadow-2xl sticky top-32 overflow-hidden border border-white/5">
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-stone-800/20 blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/10 border border-orange-600/20 rounded-full w-fit mb-8">
                  <Zap className="w-3.5 h-3.5 text-orange-600 fill-current" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 italic">
                    Elite Order Summary
                  </span>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest italic">
                      Inventory Value
                    </span>
                    <span className="font-black text-xl italic tracking-tighter">
                      Rs {cartTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest italic">
                      Shipping Protocol
                    </span>
                    <span className="font-black text-sm text-green-500 uppercase italic tracking-widest">
                      Free for Elites
                    </span>
                  </div>
                  <div className="h-px bg-white/5 my-2"></div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">
                        Total Impact
                      </span>
                      <span className="text-4xl font-black text-white uppercase italic tracking-tighter">
                        Rs {cartTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full bg-orange-600 text-white py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-600/20 hover:bg-orange-700 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 italic"
                >
                  Confirm Gear <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center gap-4 mt-10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      Live Authentication Active
                    </p>
                  </div>
                  <div className="flex gap-4 opacity-30 grayscale contrast-125">
                    {/* Placeholder for payment logos */}
                    <div className="w-8 h-5 bg-white/20 rounded"></div>
                    <div className="w-8 h-5 bg-white/20 rounded"></div>
                    <div className="w-8 h-5 bg-white/20 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
