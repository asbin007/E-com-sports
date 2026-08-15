import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import type { PaymentMethod } from "../services/paymentService";
import { pickProductImageUrl } from "../utils/placeholder";
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
  MessageCircle,
  Banknote,
  QrCode,
  Landmark,
  RefreshCw,
  AlertTriangle,
  WifiOff,
  Clock,
  UploadCloud,
} from "lucide-react";
import { motion } from "framer-motion";

const KATHMANDU_VALLEY = ["kathmandu", "lalitpur", "bhaktapur", "kirtipur", "madhyapur thimi"];
const MAJOR_CITIES = [
  "pokhara", "biratnagar", "birgunj", "dharan", "butwal", "hetauda", "bharatpur",
  "nepalgunj", "dhangadhi", "janakpur", "itahari", "banepa", "tulsipur",
  "siddharthanagar", "ghorahi", "lahan", "rajbiraj", "damak", "nepalganj",
  "bandipur", "chitwan", "narayanghat", "tansen", "palpa", "gorkha", "lamjung",
  "tanahun", "syangja", "parbat", "baglung", "myagdi", "mustang", "manang",
  "makwanpur", "parsa", "bara", "rautahat", "sarlahi", "mahottari", "dhanusha",
  "sindhuli", "ramechhap", "dolakha", "sindhupalchok", "kavre", "nuwakot",
  "rasuwa", "dhading", "kaski", "tanahu",
];

type ShippingFieldName =
  | "firstName"
  | "lastName"
  | "email"
  | "phoneNumber"
  | "addressLine"
  | "city"
  | "state"
  | "zipcode";

// Declared in DOM order so a failed validation can focus the *first* invalid field.
const SHIPPING_FIELDS: {
  name: ShippingFieldName;
  label: string;
  type: string;
  colSpan: number;
  placeholder?: string;
}[] = [
  { name: "firstName", label: "First Name", type: "text", colSpan: 1 },
  { name: "lastName", label: "Last Name", type: "text", colSpan: 1 },
  { name: "email", label: "Email", type: "email", colSpan: 1 },
  { name: "phoneNumber", label: "Phone Number", type: "tel", colSpan: 1, placeholder: "+977 98XXXXXXXX" },
  { name: "addressLine", label: "Address", type: "text", colSpan: 2, placeholder: "Street, building, area..." },
  { name: "city", label: "City", type: "text", colSpan: 1 },
  { name: "state", label: "State/Province", type: "text", colSpan: 1 },
  { name: "zipcode", label: "Zip Code", type: "text", colSpan: 1 },
];

function calculateDeliveryCharge(city: string): number {
  const normalized = city.trim().toLowerCase();
  if (KATHMANDU_VALLEY.includes(normalized)) return 100;
  if (MAJOR_CITIES.includes(normalized)) return 150;
  return 200;
}

function renderMethodIcon(type: PaymentMethod["type"]) {
  if (type === "cod") return <Banknote className="w-5 h-5" />;
  if (type === "bank") return <Landmark className="w-5 h-5" />;
  return <QrCode className="w-5 h-5" />;
}

function methodCaption(type: PaymentMethod["type"]): string {
  if (type === "cod") return "Pay when you receive";
  if (type === "bank") return "Direct bank transfer";
  return "Scan & pay instantly";
}

function getDeliveryLabel(city: string): string {
  const charge = calculateDeliveryCharge(city);
  if (charge === 100) return "Kathmandu Valley";
  if (charge === 150) return "Major City";
  return "Remote Area";
}

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // A request that never got a response — the server may still have committed the
  // order, so this must never be reported the same way as a rejection.
  const [networkFailure, setNetworkFailure] = useState(false);

  // Snapshot of what was actually placed. The cart is cleared on success, so the
  // success screen cannot recompute any of this.
  const [placedOrder, setPlacedOrder] = useState<{
    id: string | null;
    orderNumber: string | null;
    requiredProof: boolean;
    proofUploadFailed: boolean;
    whatsappText: string;
  } | null>(null);

  // State updates are async; only a ref reliably latches out a second click that
  // lands before React re-renders with `loading` set.
  const submittingRef = useRef(false);
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [formData, setFormData] = useState({
    firstName: user?.username?.split(" ")[0] || "",
    lastName: user?.username?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phoneNumber: "",
    addressLine: "",
    city: "",
    state: "",
    zipcode: "",
    paymentMethod: "",
    transactionId: "",
  });

  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [methodsError, setMethodsError] = useState("");

  const fetchPaymentMethods = useCallback(async () => {
    setMethodsLoading(true);
    setMethodsError("");
    try {
      const result = await paymentService.getPaymentMethods();
      const methods = result.data || [];
      setPaymentMethods(methods);
      // Default the selection to the first method the server returns.
      setFormData((prev) =>
        prev.paymentMethod && methods.some((m) => m.id === prev.paymentMethod)
          ? prev
          : { ...prev, paymentMethod: methods[0]?.id || "" }
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not load payment methods. Please try again.";
      setMethodsError(message);
      setPaymentMethods([]);
    } finally {
      setMethodsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // POST /orders requires auth. Letting a logged-out visitor reach the payment
  // step means they can scan the QR, send real money, then get a bare 401 with
  // no order to show for it — so send them to log in before they can pay.
  useEffect(() => {
    if (authLoading || user || success) return;
    const returnTo = "/checkout";
    navigate(`/login?redirect=${encodeURIComponent(returnTo)}`, {
      replace: true,
      state: { from: returnTo },
    });
  }, [authLoading, user, success, navigate]);

  // `user` resolves after mount, so the initial useState defaults miss it.
  // Only fill fields the customer has not already typed into.
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => {
      if (prev.firstName || prev.lastName || prev.email) return prev;
      return {
        ...prev,
        firstName: user.username?.split(" ")[0] || "",
        lastName: user.username?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
      };
    });
  }, [user]);

  const selectedMethod = useMemo(
    () => paymentMethods.find((m) => m.id === formData.paymentMethod) || null,
    [paymentMethods, formData.paymentMethod]
  );

  const requiresProof = selectedMethod?.requiresProof ?? false;

  // The amount the customer actually owes — cart plus delivery. Every figure the
  // customer is asked to pay must use this, not cartTotal.
  const deliveryCharge = formData.city ? calculateDeliveryCharge(formData.city) : 0;
  const payableTotal = cartTotal + deliveryCharge;

  // Bring an invalid field into view and put the caret in it. Inline errors are
  // useless if they render above the fold on a phone.
  const focusField = (name: string) => {
    const el = fieldRefs.current[name];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email format";
    if (!formData.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
    if (!formData.addressLine.trim()) errors.addressLine = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.state.trim()) errors.state = "State/Province is required";
    if (!formData.zipcode.trim()) errors.zipcode = "Zip code is required";
    // Merge rather than replace so the payment-proof error is not wiped.
    setFieldErrors((prev) => {
      const next = { ...prev };
      SHIPPING_FIELDS.forEach((field) => {
        next[field.name] = errors[field.name] || "";
      });
      return next;
    });
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    }
  };

  const selectPaymentMethod = (method: string) => {
    const target = paymentMethods.find((m) => m.id === method);
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
      // Clear transaction id if the new method doesn't need payment proof
      transactionId: target?.requiresProof ? prev.transactionId : "",
    }));
    if (!target?.requiresProof) {
      setPaymentScreenshot(null);
      setScreenshotPreview(null);
    }
    setError("");
  };

  // Built from an explicit snapshot: by the time the success screen renders the
  // cart has been cleared, so it can no longer read the items or the total.
  const generateWhatsAppMessage = (
    orderedItems: typeof cart,
    total: number,
    orderNumber: string | null
  ) => {
    const items = orderedItems.map((item) =>
      `• ${item.name}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ""}${item.selectedColor ? ` (${item.selectedColor})` : ""} x${item.quantity} — Rs ${((item.variantPrice || item.price || 0) * item.quantity).toLocaleString()}`
    ).join("\n");

    const paymentLabel = selectedMethod?.label || formData.paymentMethod;

    return encodeURIComponent(
      `🏆 *New Order from Brothers Sports House*\n\n` +
      `${orderNumber ? `*Order:* #${orderNumber}\n` : ""}` +
      `*Customer:* ${formData.firstName} ${formData.lastName}\n` +
      `*Phone:* ${formData.phoneNumber}\n` +
      `*Email:* ${formData.email}\n` +
      `*Address:* ${formData.addressLine}, ${formData.city}, ${formData.state} ${formData.zipcode}\n\n` +
      `*Order Items:*\n${items}\n\n` +
      `*Total:* Rs ${total.toLocaleString()}\n` +
      `*Payment:* ${paymentLabel}\n` +
      `${requiresProof && formData.transactionId ? `*Transaction ID:* ${formData.transactionId}\n` : ""}` +
      `\nPlease confirm my order. Thank you!`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeStep === 1) {
      const errors = validateStep1();
      const firstInvalid = SHIPPING_FIELDS.find((field) => errors[field.name]);
      if (firstInvalid) {
        setError("Please fill in all required fields.");
        focusField(firstInvalid.name);
        return;
      }
      setError("");
      setActiveStep(2);
      return;
    }

    // Guards the whole submit-plus-upload sequence, not just the create call.
    if (submittingRef.current) return;

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!formData.paymentMethod) {
      setError("Please select a payment method.");
      return;
    }

    // Either a transaction ID or a screenshot is enough — the labels say so too.
    if (requiresProof && !formData.transactionId.trim() && !paymentScreenshot) {
      setFieldErrors((prev) => ({
        ...prev,
        paymentProof: "Enter your Transaction ID or upload a payment screenshot.",
      }));
      setError("");
      focusField("transactionId");
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError("");
    setNetworkFailure(false);
    setFieldErrors((prev) => ({ ...prev, paymentProof: "" }));

    try {
      const items = cart.map((item) => ({
        productId: item.id,
        variantId: item.variantId,
        size: item.selectedSize,
        color: item.selectedColor,
        quantity: item.quantity,
        price: item.variantPrice || item.price,
      }));

      const orderData = {
        ...formData,
        items,
        paymentPid: requiresProof ? formData.transactionId : undefined,
      };

      const result = await orderService.createOrder(orderData);

      const orderId: string | null = result?.data?.id ?? null;
      const orderNumber: string | null =
        result?.orderNumber ?? result?.data?.orderNumber ?? null;

      // Upload payment screenshot if provided (methods that require proof)
      let proofUploadFailed = false;
      if (requiresProof && (paymentScreenshot || formData.transactionId.trim())) {
        if (orderId) {
          try {
            await orderService.uploadPaymentProof(
              orderId,
              formData.transactionId,
              paymentScreenshot || undefined
            );
          } catch (uploadError) {
            // The customer has already sent real money. Never swallow this —
            // the success screen sends them to the order page to re-upload.
            console.error("Payment proof upload failed, order still created", uploadError);
            proofUploadFailed = true;
          }
        } else {
          proofUploadFailed = true;
        }
      }

      setPlacedOrder({
        id: orderId,
        orderNumber,
        requiredProof: requiresProof,
        proofUploadFailed,
        whatsappText: generateWhatsAppMessage(cart, payableTotal, orderNumber),
      });
      setSuccess(true);
      clearCart();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      if (!axiosError?.response) {
        // No response at all — the server may well have committed the order.
        // "Try again" here creates a duplicate and decrements stock twice.
        setNetworkFailure(true);
        setError("");
      } else {
        setError(
          axiosError.response?.data?.message || "Failed to place order. Please try again."
        );
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  // Success Screen
  if (success) {
    const orderReference =
      placedOrder?.orderNumber ||
      (placedOrder?.id ? placedOrder.id.slice(-8).toUpperCase() : null);
    // Anything paid manually is NOT confirmed — an admin still has to verify it.
    const awaitingVerification = placedOrder?.requiredProof ?? false;
    const proofUploadFailed = placedOrder?.proofUploadFailed ?? false;
    const orderDetailPath = placedOrder?.id
      ? `/dashboard/orders/${placedOrder.id}`
      : "/dashboard/orders";

    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-card p-8 sm:p-12 rounded-2xl shadow-xl border border-border-primary text-center max-w-lg w-full"
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              awaitingVerification ? "bg-accent/10" : "bg-green-500/10"
            }`}
          >
            {awaitingVerification ? (
              <Clock className="w-8 h-8 text-accent" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
          </div>

          <h2 className="text-2xl font-black text-primary mb-2">
            {awaitingVerification ? "Order Received" : "Order Placed Successfully!"}
          </h2>
          <p className="text-tertiary text-sm mb-6">
            {awaitingVerification
              ? "We have your order, but it is not confirmed yet — our team still has to check your payment manually. We'll update you on WhatsApp and email as soon as it's verified."
              : "Your order is confirmed. Please keep the cash ready for the delivery partner. You'll receive updates on WhatsApp and email."}
          </p>

          {/* The number the customer needs to quote on a support call. */}
          {orderReference && (
            <div className="bg-secondary border border-border-primary rounded-xl px-4 py-3 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Your order number
              </p>
              <p className="text-xl font-black text-primary tracking-wide mt-0.5">
                #{orderReference}
              </p>
              <p className="text-[10px] text-muted mt-1">
                Quote this if you contact us about this order.
              </p>
            </div>
          )}

          {/* Proof upload failed — the money is already gone, so say so plainly
              and hand them a direct route to re-send it. */}
          {proofUploadFailed && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-left flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-amber-600">
                  Your payment proof did not upload
                </h3>
                <p className="text-xs text-secondary mt-1 leading-relaxed">
                  Your order was created, but the transaction ID and screenshot never
                  reached us, so we cannot verify your payment yet. Please re-send your
                  proof from the order page — do not pay again.
                </p>
                <Link
                  to={orderDetailPath}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl font-bold text-xs hover:bg-accent-hover transition-all active:scale-95"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Re-send payment proof
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* WhatsApp Confirmation */}
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "9779748477628"}?text=${placedOrder?.whatsappText || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-[#25D366] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-all active:scale-95 shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-5 h-5" />
              Confirm on WhatsApp
            </a>

            <button
              onClick={() => navigate(orderDetailPath)}
              className="w-full py-3.5 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent-hover transition-all active:scale-95"
            >
              {placedOrder?.id ? "View This Order" : "View My Orders"}
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full py-3.5 bg-secondary text-primary border border-border-primary rounded-xl font-semibold text-sm hover:bg-surface-hover transition-all active:scale-95"
            >
              Continue Shopping
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-border-primary flex items-center justify-center gap-2">
            {awaitingVerification ? (
              <>
                <Clock className="w-4 h-4 text-accent" />
                <p className="text-xs text-muted">Awaiting manual payment verification</p>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted">Order confirmed & secured</p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Auth is still resolving, or the redirect above is about to fire. Either way
  // the payment step must not be reachable.
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-accent" />
        <span className="sr-only">Checking your account…</span>
      </div>
    );
  }

  const alertBanners = (
    <>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 mb-6"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {/* No response came back, so we genuinely do not know whether the order
          was created. Retrying blind is what duplicates a paid order. */}
      {networkFailure && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-6"
        >
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-amber-600">
                We couldn't reach the server
              </h3>
              <p className="text-xs text-secondary mt-1 leading-relaxed">
                Your connection dropped before we heard back, so your order may still
                have gone through. Please check My Orders first — placing it again
                could charge you for a duplicate order.
              </p>
              <Link
                to="/dashboard/orders"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl font-bold text-xs hover:bg-accent-hover transition-all active:scale-95"
              >
                Check My Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-primary pt-4 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8 border-b border-border-primary">
          <button
            onClick={() => activeStep === 2 ? setActiveStep(1) : navigate("/cart")}
            className="flex items-center gap-1 text-sm text-tertiary hover:text-accent transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            {activeStep === 2 ? "Back to shipping" : "Back to cart"}
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-primary">Checkout</h1>

          {/* Steps */}
          <div className="flex items-center gap-3 mt-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${activeStep >= 1 ? "bg-accent/10 text-accent" : "bg-secondary text-muted"}`}>
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">1</span>
              Shipping
            </div>
            <div className="w-8 h-px bg-border-primary" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${activeStep >= 2 ? "bg-accent/10 text-accent" : "bg-secondary text-muted"}`}>
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${activeStep >= 2 ? "bg-accent text-white" : "bg-tertiary text-muted"}`}>2</span>
              Payment
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Form */}
          <div className="lg:col-span-7">
            {/* On step 1 the banner sits at the top of the form the customer is
                looking at; on step 2 it is rendered down beside the submit
                button instead, where the customer is actually scrolled to. */}
            {activeStep === 1 && alertBanners}

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Shipping (only shown on Step 1) */}
              {activeStep === 1 && (
                <div>
                  <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-accent" />
                    Shipping Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SHIPPING_FIELDS.map((field) => {
                      const fieldId = `checkout-${field.name}`;
                      const errorId = `${fieldId}-error`;
                      const hasError = Boolean(fieldErrors[field.name]);
                      return (
                        <div key={field.name} className={field.colSpan === 2 ? "md:col-span-2" : ""}>
                          <label
                            htmlFor={fieldId}
                            className="text-xs font-medium text-secondary mb-1.5 block"
                          >
                            {field.label}{" "}
                            <span className="text-red-400" aria-hidden="true">*</span>
                            <span className="sr-only">(required)</span>
                          </label>
                          <input
                            id={fieldId}
                            ref={(el) => {
                              fieldRefs.current[field.name] = el;
                            }}
                            type={field.type}
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            aria-required="true"
                            aria-invalid={hasError || undefined}
                            aria-describedby={hasError ? errorId : undefined}
                            className={`w-full px-4 py-3 bg-secondary border rounded-xl text-primary text-sm font-medium outline-none transition-all placeholder:text-muted ${
                              hasError
                                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                : "border-border-primary focus:border-accent focus:ring-2 focus:ring-accent/10"
                            }`}
                          />
                          {hasError && (
                            <p id={errorId} role="alert" className="text-red-500 text-xs mt-1">
                              {fieldErrors[field.name]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Inline next-step button so it's always visible on Step 1,
                      not just in the sidebar (which can scroll out of view). */}
                  <button
                    type="submit"
                    className="w-full mt-6 py-4 bg-accent text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Payment (only shown on Step 2) */}
              {activeStep === 2 && (
              <div>
                <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent" />
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {/* Loading methods */}
                  {methodsLoading && (
                    <div className="p-8 rounded-xl border border-border-primary bg-secondary flex flex-col items-center justify-center gap-3">
                      <Loader className="w-6 h-6 animate-spin text-accent" />
                      <p className="text-xs text-tertiary">Loading payment methods...</p>
                    </div>
                  )}

                  {/* Methods failed to load */}
                  {!methodsLoading && methodsError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl"
                    >
                      <div className="flex items-center gap-3 text-red-500">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{methodsError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchPaymentMethods}
                        className="mt-3 px-4 py-2 bg-accent text-white rounded-xl font-bold text-xs hover:bg-accent-hover transition-all active:scale-95 flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try again
                      </button>
                    </motion.div>
                  )}

                  {/* No methods configured */}
                  {!methodsLoading && !methodsError && paymentMethods.length === 0 && (
                    <div className="p-5 rounded-xl border border-border-primary bg-secondary">
                      <p className="text-sm text-tertiary">
                        No payment methods are available right now. Please contact us to
                        complete your order.
                      </p>
                    </div>
                  )}

                  {/* Method selector */}
                  {!methodsLoading && paymentMethods.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {paymentMethods.map((method, index) => {
                        const isActive = formData.paymentMethod === method.id;
                        return (
                          <motion.button
                            key={method.id}
                            type="button"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => selectPaymentMethod(method.id)}
                            className={`text-left p-4 rounded-xl border-2 transition-all ${
                              isActive
                                ? "border-accent bg-accent/5"
                                : "border-border-primary bg-secondary hover:border-accent/40"
                            }`}
                          >
                            <div className="flex flex-col gap-2.5">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  isActive ? "bg-accent text-white" : "bg-card text-primary"
                                }`}
                              >
                                {renderMethodIcon(method.type)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-primary">{method.label}</h4>
                                <p className="text-[11px] text-tertiary">
                                  {methodCaption(method.type)}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected method details */}
                  {selectedMethod && (
                    <div className="p-5 rounded-xl border-2 border-accent bg-accent/5 space-y-4">
                      {/* QR method */}
                      {selectedMethod.type === "qr" && (
                        <div className="flex flex-col items-center">
                          <p className="text-xs font-bold text-primary mb-3">
                            Scan to Pay with {selectedMethod.label}
                          </p>
                          {selectedMethod.qrImage ? (
                            <div className="w-48 h-48 bg-white rounded-xl overflow-hidden shadow-sm border border-border-primary p-2">
                              <img
                                src={selectedMethod.qrImage}
                                className="w-full h-full object-contain"
                                alt={`${selectedMethod.label} payment QR code`}
                              />
                            </div>
                          ) : (
                            <div className="w-full p-4 rounded-xl border border-dashed border-border-primary bg-secondary flex items-start gap-3">
                              <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                              <p className="text-xs text-tertiary leading-relaxed">
                                QR not configured yet — please use the account details below to
                                send your payment.
                              </p>
                            </div>
                          )}
                          <p className="text-lg font-bold text-accent mt-3">
                            Amount: Rs {payableTotal.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted mt-1">
                            After payment, enter the transaction ID below
                          </p>

                          {(selectedMethod.accountName || selectedMethod.accountNumber) && (
                            <div className="w-full mt-4 pt-4 border-t border-border-primary space-y-2">
                              {selectedMethod.accountName && (
                                <div className="flex justify-between gap-3 text-xs">
                                  <span className="text-secondary">Account Name</span>
                                  <span className="font-semibold text-primary text-right">
                                    {selectedMethod.accountName}
                                  </span>
                                </div>
                              )}
                              {selectedMethod.accountNumber && (
                                <div className="flex justify-between gap-3 text-xs">
                                  <span className="text-secondary">Account Number</span>
                                  <span className="font-semibold text-primary text-right">
                                    {selectedMethod.accountNumber}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bank transfer method */}
                      {selectedMethod.type === "bank" && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent text-white shrink-0">
                            <Landmark className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-primary mb-3">
                              Transfer Rs {payableTotal.toLocaleString()} to our account
                            </h4>
                            <div className="space-y-2">
                              {[
                                { label: "Bank Name", value: selectedMethod.bankName },
                                { label: "Branch", value: selectedMethod.branch },
                                { label: "Account Name", value: selectedMethod.accountName },
                                { label: "Account Number", value: selectedMethod.accountNumber },
                              ]
                                .filter((row) => row.value)
                                .map((row) => (
                                  <div
                                    key={row.label}
                                    className="flex justify-between gap-3 text-xs"
                                  >
                                    <span className="text-secondary">{row.label}</span>
                                    <span className="font-semibold text-primary text-right">
                                      {row.value}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* COD method */}
                      {selectedMethod.type === "cod" && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent text-white shrink-0">
                            <Banknote className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-primary mb-1">
                              Pay with cash on delivery
                            </h4>
                            <p className="text-xs text-tertiary leading-relaxed">
                              Keep the exact amount of{" "}
                              <span className="font-bold text-primary">
                                Rs {payableTotal.toLocaleString()}
                              </span>{" "}
                              ready. Our delivery partner will collect payment when your order
                              arrives. No transaction ID required.
                            </p>
                            <ul className="mt-3 space-y-1.5 text-[11px] text-secondary">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Inspect before you pay
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Cash only at delivery
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Keep your phone reachable
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Instructions — shown for every method */}
                      {selectedMethod.instructions && (
                        <p className="text-[11px] text-tertiary leading-relaxed pt-3 border-t border-border-primary">
                          {selectedMethod.instructions}
                        </p>
                      )}

                      {/* Proof of payment — only for methods that require it */}
                      {requiresProof && (
                        <div className="space-y-4 pt-3 border-t border-border-primary">
                          {/* Either field satisfies the check, so neither is marked
                              required on its own — the requirement is the pair. */}
                          <p className="text-[11px] text-secondary">
                            Send us proof of your payment:{" "}
                            <span className="font-bold text-primary">
                              a Transaction ID or a screenshot
                            </span>{" "}
                            — either one is enough.{" "}
                            <span className="text-red-400" aria-hidden="true">*</span>
                          </p>

                          <div>
                            <label
                              htmlFor="checkout-transactionId"
                              className="text-xs font-medium text-secondary mb-1.5 block"
                            >
                              Transaction ID
                            </label>
                            <input
                              id="checkout-transactionId"
                              ref={(el) => {
                                fieldRefs.current.transactionId = el;
                              }}
                              type="text"
                              name="transactionId"
                              value={formData.transactionId}
                              onChange={handleChange}
                              placeholder="e.g. TXN-12345678"
                              aria-invalid={Boolean(fieldErrors.paymentProof) || undefined}
                              aria-describedby={
                                fieldErrors.paymentProof ? "checkout-proof-error" : undefined
                              }
                              className={`w-full px-4 py-3 bg-secondary border rounded-xl text-primary text-sm font-medium outline-none transition-all placeholder:text-muted ${
                                fieldErrors.paymentProof
                                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                                  : "border-border-primary focus:border-accent focus:ring-2 focus:ring-accent/10"
                              }`}
                            />
                          </div>

                          {/* Payment Screenshot Upload */}
                          <div>
                            <label
                              htmlFor="checkout-paymentScreenshot"
                              className="text-xs font-medium text-secondary mb-1.5 block"
                            >
                              Payment Screenshot
                            </label>
                            <div className="relative">
                              <input
                                id="checkout-paymentScreenshot"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  setPaymentScreenshot(file);
                                  if (file) {
                                    setScreenshotPreview(URL.createObjectURL(file));
                                  } else {
                                    setScreenshotPreview(null);
                                  }
                                  if (file) {
                                    setFieldErrors((prev) => ({ ...prev, paymentProof: "" }));
                                  }
                                }}
                                aria-invalid={Boolean(fieldErrors.paymentProof) || undefined}
                                aria-describedby={
                                  fieldErrors.paymentProof
                                    ? "checkout-proof-error checkout-screenshot-hint"
                                    : "checkout-screenshot-hint"
                                }
                                className="w-full px-4 py-3 bg-secondary border border-border-primary rounded-xl text-primary text-sm font-medium focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                              />
                            </div>
                            {screenshotPreview && (
                              <div className="mt-3 relative inline-block">
                                <img
                                  src={screenshotPreview}
                                  alt="Payment screenshot you selected"
                                  className="w-32 h-40 object-cover rounded-lg border border-border-primary"
                                />
                                <button
                                  type="button"
                                  aria-label="Remove payment screenshot"
                                  onClick={() => { setPaymentScreenshot(null); setScreenshotPreview(null); }}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                                >
                                  <span aria-hidden="true">×</span>
                                </button>
                              </div>
                            )}
                            <p id="checkout-screenshot-hint" className="text-[10px] text-muted mt-1.5">
                              Upload screenshot of your payment confirmation
                            </p>
                          </div>

                          {/* Rendered beside the fields it refers to, not at the
                              top of the page the customer scrolled away from. */}
                          {fieldErrors.paymentProof && (
                            <p
                              id="checkout-proof-error"
                              role="alert"
                              className="text-red-500 text-xs font-medium flex items-center gap-1.5"
                            >
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              {fieldErrors.paymentProof}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Errors belong next to the control that produced them — at
                    step 2 the customer is scrolled well past the top banner. */}
                <div className="mt-6">{alertBanners}</div>

                {/* Inline submit so Step 2 has a Place Order button without
                    scrolling past the QR, the account rows, the upload fields
                    and the whole item list to reach the sidebar (Step 1 does
                    the same). Disabled for the entire submit-plus-upload run. */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-accent text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Placing your order...
                    </>
                  ) : (
                    <>
                      Place Order · Rs {payableTotal.toLocaleString()}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-card rounded-2xl p-6 border border-border-primary sticky top-28 shadow-sm">
              <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-accent" />
                Order Summary
              </h2>

              {/* Items */}
              <div className="max-h-[280px] overflow-y-auto space-y-4 mb-6 scrollbar-thin">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.variantId}`} className="flex gap-3">
                    <div className="w-14 h-16 bg-secondary rounded-lg overflow-hidden shrink-0 border border-border-primary">
                      <img
                        src={pickProductImageUrl(item.images)}
                        className="w-full h-full object-cover"
                        alt={item.name}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-primary truncate">{item.name}</h4>
                      <div className="flex gap-2 text-[10px] text-muted mt-0.5">
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                        {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                        <span>Qty: {item.quantity}</span>
                      </div>
                      <p className="text-sm font-bold text-primary mt-1">
                        Rs {((item.variantPrice || item.price || 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 pt-4 border-t border-border-primary">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Subtotal</span>
                  <span className="font-semibold text-primary">Rs {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">
                    Shipping
                    {formData.city && (
                      <span className="text-muted"> · {getDeliveryLabel(formData.city)}</span>
                    )}
                  </span>
                  <span className="font-semibold text-primary">
                    {formData.city ? `Rs ${deliveryCharge}` : "Enter city"}
                  </span>
                </div>
                <hr className="border-border-primary" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">Total</span>
                  <span className="text-2xl font-black text-primary">
                    Rs {payableTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full mt-6 py-4 bg-accent text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : activeStep === 1 ? (
                  <>Continue to Payment <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Place Order <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4">
                <Lock className="w-3.5 h-3.5 text-muted" />
                <p className="text-[10px] text-muted">Secure & encrypted checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
