import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/orderService";
import {
  Loader,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Truck,
  CreditCard,
  ChevronLeft,
  ArrowRight,
  Package,
  Lock,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import api from "../services/api";

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    addressLine: "",
    city: "",
    state: "",
    zipcode: "",
    paymentMethod: "COD",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim())
      errors.firstName = "First Identity required";
    if (!formData.lastName.trim()) errors.lastName = "Last Identity required";
    if (!formData.email.trim()) {
      errors.email = "Comm Channel required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid Comm Channel format";
    }
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Signal Code (Phone) required";
    }
    if (!formData.addressLine.trim())
      errors.addressLine = "Location Details required";
    if (!formData.city.trim()) errors.city = "City Hub required";
    if (!formData.state.trim()) errors.state = "State Code required";
    if (!formData.zipcode.trim()) errors.zipcode = "Zip Sector required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user types
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeStep === 1) {
      if (!validateStep1()) {
        setError("Please correct the errors in the protocol fields.");
        return;
      }
      setActiveStep(2);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const items = cart
        .filter((item) => item.variantId && item.variantId !== "mock-id")
        .map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        }));

      if (items.length === 0) {
        setError(
          "Your cart contains invalid items. Please clear your cart and try again.",
        );
        setLoading(false);
        return;
      }

      const orderData = {
        ...formData,
        items,
      };

      const response = await orderService.createOrder(orderData);

      if (formData.paymentMethod === "khalti") {
        try {
          // Initiate Khalti Payment
          const paymentResponse = await api.post("/khalti/initialize", {
            orderId: response.data.id, // Response structure is { message, data: { ... } } based on controller
            amount: cartTotal,
          });

          if (paymentResponse.data.payment_url) {
            window.location.href = paymentResponse.data.payment_url;
            return;
          }
        } catch (paymentError: any) {
          console.error("Payment initiation failed", paymentError);
          setError(
            "Order created but payment initiation failed. Please check your orders.",
          );
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
      clearCart();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Protocol Failure: Order Rejected",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6 sm:p-12 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "circOut" }}
          className="bg-white p-12 rounded-[3.5rem] shadow-[0_0_100px_rgba(234,88,12,0.15)] text-center max-w-xl w-full relative"
        >
          {/* Success Badge */}
          <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-green-500/10 blur-xl rounded-full scale-110" />
            <CheckCircle className="w-12 h-12 text-green-600 relative z-10" />
          </div>

          <div className="space-y-4 mb-10">
            <h2 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] italic">
              Mission Accomplished
            </h2>
            <h3 className="text-5xl font-black text-stone-950 uppercase italic tracking-tighter leading-none">
              Order <span className="text-green-600">Secured</span>
            </h3>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] max-w-xs mx-auto leading-relaxed">
              Your elite gear has been reserved. Check your comms for the
              deployment tracking ID.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/")}
              className="w-full bg-stone-950 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 italic"
            >
              Continue Drops
            </button>
            <button className="w-full bg-white border-2 border-stone-950 text-stone-950 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-orange-600 hover:text-orange-600 transition-all active:scale-95 italic">
              Print Protocol
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Authenticated & Protected
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-2">
            <button
              onClick={() => navigate("/cart")}
              className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-stone-950 transition-colors group mb-4"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retreat to Locker
            </button>
            <h1 className="text-6xl font-black text-stone-950 tracking-tighter uppercase italic leading-none">
              Elite <span className="text-orange-600">Checkout</span>
            </h1>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1 text-right">
                Step Status
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${activeStep >= 1 ? "bg-orange-600" : "bg-gray-200"}`}
                />
                <div
                  className={`w-12 h-1 bg-gray-100 rounded-full overflow-hidden`}
                >
                  <div
                    className={`h-full bg-orange-600 transition-all duration-500 w-${activeStep >= 2 ? "full" : "0"}`}
                  />
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${activeStep >= 2 ? "bg-orange-600" : "bg-gray-200"}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-12">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-[2rem] flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">
                    Alert
                  </p>
                  <p className="text-xs font-bold">{error}</p>
                </div>
              </motion.div>
            )}

            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="space-y-12"
            >
              {/* Step 1: Shipping */}
              <div
                className={`transition-all duration-500 ${activeStep !== 1 ? "opacity-30 pointer-events-none grayscale" : ""}`}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-stone-950 text-white rounded-2xl flex items-center justify-center font-black italic shadow-lg">
                    01
                  </div>
                  <h2 className="text-2xl font-black text-stone-950 uppercase italic tracking-tight">
                    Deployment Address
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      First Identity
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-6 py-4 bg-white border ${fieldErrors.firstName ? "border-red-500 focus:border-red-500 ring-4 ring-red-500/5" : "border-gray-100 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5"} rounded-2xl transition-all outline-none font-bold text-sm`}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-red-500 text-[10px] font-bold px-1">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      Last Identity
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-6 py-4 bg-white border ${fieldErrors.lastName ? "border-red-500 focus:border-red-500 ring-4 ring-red-500/5" : "border-gray-100 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5"} rounded-2xl transition-all outline-none font-bold text-sm`}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-red-500 text-[10px] font-bold px-1">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      Digital Comm Channel
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-6 py-4 bg-white border ${fieldErrors.email ? "border-red-500 focus:border-red-500 ring-4 ring-red-500/5" : "border-gray-100 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5"} rounded-2xl transition-all outline-none font-bold text-sm`}
                    />
                    {fieldErrors.email && (
                      <p className="text-red-500 text-[10px] font-bold px-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      Signal Code
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+977"
                      className={`w-full px-6 py-4 bg-white border ${fieldErrors.phoneNumber ? "border-red-500 focus:border-red-500 ring-4 ring-red-500/5" : "border-gray-100 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5"} rounded-2xl transition-all outline-none font-bold text-sm`}
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="text-red-500 text-[10px] font-bold px-1">
                        {fieldErrors.phoneNumber}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      Secure Location Details
                    </label>
                    <input
                      type="text"
                      name="addressLine"
                      value={formData.addressLine}
                      onChange={handleChange}
                      placeholder="Building, street, sector..."
                      className={`w-full px-6 py-4 bg-white border ${fieldErrors.addressLine ? "border-red-500 focus:border-red-500 ring-4 ring-red-500/5" : "border-gray-100 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5"} rounded-2xl transition-all outline-none font-bold text-sm`}
                    />
                    {fieldErrors.addressLine && (
                      <p className="text-red-500 text-[10px] font-bold px-1">
                        {fieldErrors.addressLine}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      City Hub
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-6 py-4 bg-white border ${fieldErrors.city ? "border-red-500 focus:border-red-500 ring-4 ring-red-500/5" : "border-gray-100 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5"} rounded-2xl transition-all outline-none font-bold text-sm`}
                    />
                    {fieldErrors.city && (
                      <p className="text-red-500 text-[10px] font-bold px-1">
                        {fieldErrors.city}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                        State Code
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`w-full px-6 py-4 bg-white border ${fieldErrors.state ? "border-red-500 focus:border-red-500 ring-4 ring-red-500/5" : "border-gray-100 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5"} rounded-2xl transition-all outline-none font-bold text-sm`}
                      />
                      {fieldErrors.state && (
                        <p className="text-red-500 text-[10px] font-bold px-1">
                          {fieldErrors.state}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                        Zip Sector
                      </label>
                      <input
                        type="text"
                        name="zipcode"
                        value={formData.zipcode}
                        onChange={handleChange}
                        className={`w-full px-6 py-4 bg-white border ${fieldErrors.zipcode ? "border-red-500 focus:border-red-500 ring-4 ring-red-500/5" : "border-gray-100 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5"} rounded-2xl transition-all outline-none font-bold text-sm`}
                      />
                      {fieldErrors.zipcode && (
                        <p className="text-red-500 text-[10px] font-bold px-1">
                          {fieldErrors.zipcode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Payment */}
              <div
                className={`transition-all duration-500 ${activeStep !== 2 ? "opacity-30" : ""}`}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic shadow-lg ${activeStep >= 2 ? "bg-stone-950 text-white" : "bg-gray-100 text-gray-400"}`}
                  >
                    02
                  </div>
                  <h2 className="text-2xl font-black text-stone-950 uppercase italic tracking-tight">
                    Financial Protocol
                  </h2>
                </div>

                <div className="space-y-4">
                  <label
                    className={`block group cursor-pointer transition-all ${formData.paymentMethod === "COD" ? "scale-[1.02]" : ""}`}
                  >
                    <div
                      className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center gap-6 ${formData.paymentMethod === "COD" ? "bg-stone-950 border-orange-600" : "bg-white border-gray-100"}`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${formData.paymentMethod === "COD" ? "bg-orange-600" : "bg-gray-50"}`}
                      >
                        <Truck
                          className={`w-6 h-6 ${formData.paymentMethod === "COD" ? "text-white" : "text-gray-400"}`}
                        />
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`text-sm font-black uppercase tracking-widest mb-1 italic ${formData.paymentMethod === "COD" ? "text-white" : "text-stone-950"}`}
                        >
                          Cash on Deployment
                        </h4>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Pay in physical currency upon arrival
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === "COD"}
                        onChange={handleChange}
                        className="w-5 h-5 accent-orange-600"
                      />
                    </div>
                  </label>

                  <label
                    className={`block group cursor-pointer transition-all ${formData.paymentMethod === "khalti" ? "scale-[1.02]" : ""}`}
                  >
                    <div
                      className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center gap-6 ${formData.paymentMethod === "khalti" ? "bg-purple-900 border-purple-500" : "bg-white border-gray-100"}`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${formData.paymentMethod === "khalti" ? "bg-purple-600" : "bg-gray-50"}`}
                      >
                        <div
                          className={`text-xl font-bold ${formData.paymentMethod === "khalti" ? "text-white" : "text-gray-400"}`}
                        >
                          K
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`text-sm font-black uppercase tracking-widest mb-1 italic ${formData.paymentMethod === "khalti" ? "text-white" : "text-stone-950"}`}
                        >
                          Khalti Wallet
                        </h4>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Secure Digital Payment
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="khalti"
                        checked={formData.paymentMethod === "khalti"}
                        onChange={handleChange}
                        className="w-5 h-5 accent-purple-600"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </form>

            {/* Verification Items */}
            <div className="pt-12 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-stone-950" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-950 italic">
                    End-to-End Encryption
                  </h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                    Your data is secured in the Brothers Shoe vault
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-950 italic">
                    Elite Guarantee
                  </h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                    Authenticity verified before every deployment
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Summary */}
          <div className="lg:col-span-5">
            <div className="bg-stone-50 rounded-[3rem] p-10 border border-gray-100 shadow-sm sticky top-32 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-950 text-white rounded-full w-fit mb-10">
                <Package className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest italic">
                  Inventory Payload
                </span>
              </div>

              <div className="max-h-[350px] overflow-y-auto pr-4 mb-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={`${item.id}-${item.selectedSize}`}
                      layout
                      className="flex gap-6 group"
                    >
                      <div className="w-20 h-24 bg-white rounded-[1.5rem] border border-gray-100 overflow-hidden shrink-0 shadow-sm relative">
                        <img
                          src={
                            item.ProductImages?.[0]?.url ||
                            "https://via.placeholder.com/100"
                          }
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute top-1 right-1 bg-stone-950 text-white w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center italic">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 py-1">
                        <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest italic mb-0.5">
                          {item.Brand?.name}
                        </p>
                        <h4 className="text-sm font-black text-stone-950 uppercase italic tracking-tight line-clamp-1 mb-2 leading-tight">
                          {item.name}
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-gray-100">
                            D:{item.selectedSize}
                          </span>
                          <p className="text-sm font-black text-stone-950 italic">
                            Rs{" "}
                            {(
                              (item.price || 5999) * item.quantity
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="space-y-6 pt-8 border-t border-gray-200">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                    Gross Payload
                  </span>
                  <span className="font-black text-lg italic tracking-tight">
                    Rs {cartTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                    Shipping Link
                  </span>
                  <span className="font-black text-xs text-green-600 uppercase italic tracking-widest">
                    Protocol Active
                  </span>
                </div>
                <div className="pt-6 relative">
                  <div className="absolute top-0 left-0 right-0 h-px bg-stone-950/5" />
                  <div className="flex justify-between items-center bg-stone-950 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl rounded-full" />
                    <div className="relative z-10">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1 block">
                        Total Liability
                      </span>
                      <span className="text-3xl font-black italic tracking-tighter">
                        Rs {cartTotal.toLocaleString()}
                      </span>
                    </div>
                    <Zap className="w-10 h-10 text-orange-600 fill-current opacity-30 relative z-10" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full mt-10 bg-orange-600 text-white py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-600/20 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-3 italic disabled:opacity-70"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : activeStep === 1 ? (
                  <>
                    Next Protocol <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Submit Order <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-8 opacity-40">
                <Lock className="w-3 h-3 text-stone-950" />
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-950">
                  Secure Deployment Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
