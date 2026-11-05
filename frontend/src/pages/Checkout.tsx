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
import { motion, useReducedMotion } from "framer-motion";
import { STORE } from "../data/store";

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

const LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary";
const INPUT_BASE =
  "w-full rounded-tag border-2 bg-card px-4 py-3 text-sm text-primary transition-all duration-snap ease-snap placeholder:text-muted";
const BTN_PRIMARY =
  "flex w-full items-center justify-center gap-2 rounded-tag border-2 border-inverse bg-accent py-3 font-display text-xl uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:border-border-primary disabled:bg-secondary disabled:text-muted disabled:shadow-none";
const BTN_SECONDARY =
  "flex w-full items-center justify-center gap-2 rounded-tag border-2 border-inverse bg-transparent py-3 font-display text-lg uppercase leading-none tracking-[0.04em] text-primary transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";
const BTN_INLINE_ACCENT =
  "inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-accent px-4 font-display text-base uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";
const RECEIPT_ROW = "flex items-baseline justify-between gap-3 border-b border-border-primary py-2.5 text-sm";

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
  const reduce = useReducedMotion();

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
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
          className="w-full max-w-lg rounded-card border-2 border-inverse bg-card p-8 text-center sm:p-12"
        >
          <div
            className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-tag border-2 ${
              awaitingVerification
                ? "border-sale bg-sale-soft"
                : "border-pitch bg-card"
            }`}
          >
            {awaitingVerification ? (
              <Clock className="h-8 w-8 text-sale" aria-hidden="true" />
            ) : (
              <CheckCircle className="h-8 w-8 text-pitch" aria-hidden="true" />
            )}
          </div>

          <h1 className="mb-2 font-display text-[34px] font-semibold uppercase leading-none text-primary">
            {awaitingVerification ? "Order Received" : "Order Placed"}
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-tertiary">
            {awaitingVerification
              ? "We have your order, but it is not confirmed yet — our team still has to check your payment manually. We'll update you on WhatsApp and email as soon as it's verified."
              : "Your order is confirmed. Please keep the cash ready for the delivery partner. You'll receive updates on WhatsApp and email."}
          </p>

          {/* The number the customer needs to quote on a support call. */}
          {orderReference && (
            <div className="mb-6 rounded-tag border-2 border-inverse bg-secondary px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                Your order number
              </p>
              <p className="mt-0.5 font-display text-[29px] font-semibold leading-none tabular-nums text-primary">
                #{orderReference}
              </p>
              <p className="mt-1 text-[11px] text-tertiary">
                Quote this if you contact us about this order.
              </p>
            </div>
          )}

          {/* Proof upload failed — the money is already gone, so say so plainly
              and hand them a direct route to re-send it. */}
          {proofUploadFailed && (
            <div className="mb-6 flex items-start gap-3 rounded-tag border-2 border-sale bg-sale-soft p-4 text-left">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-sale" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold uppercase leading-none text-primary">
                  Your payment proof did not upload
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-primary">
                  Your order was created, but the transaction ID and screenshot never
                  reached us, so we cannot verify your payment yet. Please re-send your
                  proof from the order page — do not pay again.
                </p>
                <Link to={orderDetailPath} className={`mt-3 ${BTN_INLINE_ACCENT}`}>
                  <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                  Re-send payment proof
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* WhatsApp Confirmation */}
            <a
              href={`https://wa.me/${STORE.whatsapp}?text=${placedOrder?.whatsappText || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-tag border-2 border-pitch bg-transparent py-3 font-display text-lg uppercase leading-none tracking-[0.04em] text-pitch transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Confirm on WhatsApp
            </a>

            <button onClick={() => navigate(orderDetailPath)} className={BTN_PRIMARY}>
              {placedOrder?.id ? "View This Order" : "View My Orders"}
            </button>

            <button onClick={() => navigate("/")} className={BTN_SECONDARY}>
              Continue Shopping
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 border-t-2 border-inverse pt-6">
            {awaitingVerification ? (
              <>
                <Clock className="h-4 w-4 text-sale" aria-hidden="true" />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sale">
                  Awaiting manual payment verification
                </p>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-pitch" aria-hidden="true" />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-pitch">
                  Order confirmed
                </p>
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
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
          role="alert"
          className="mb-6 flex items-center gap-3 rounded-tag border-2 border-accent bg-card p-4"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-accent" aria-hidden="true" />
          <p className="text-sm font-bold text-accent">{error}</p>
        </motion.div>
      )}

      {/* No response came back, so we genuinely do not know whether the order
          was created. Retrying blind is what duplicates a paid order. */}
      {networkFailure && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
          role="alert"
          className="mb-6 rounded-tag border-2 border-sale bg-sale-soft p-4"
        >
          <div className="flex items-start gap-3">
            <WifiOff className="mt-0.5 h-5 w-5 flex-shrink-0 text-sale" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold uppercase leading-none text-primary">
                We couldn't reach the server
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-primary">
                Your connection dropped before we heard back, so your order may still
                have gone through. Please check My Orders first — placing it again
                could charge you for a duplicate order.
              </p>
              <Link to="/dashboard/orders" className={`mt-3 ${BTN_INLINE_ACCENT}`}>
                Check My Orders <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
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
        <div className="border-b-[3px] border-inverse py-8">
          <button
            onClick={() => activeStep === 2 ? setActiveStep(1) : navigate("/cart")}
            className="mb-4 flex min-h-[44px] items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary transition-colors duration-snap ease-snap hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {activeStep === 2 ? "Back to shipping" : "Back to cart"}
          </button>
          <h1 className="font-display text-[34px] font-semibold uppercase leading-none text-primary md:text-[44px]">
            Checkout
          </h1>

          {/* Steps */}
          <div className="mt-4 flex items-center gap-3">
            <div
              className={`flex min-h-[44px] items-center gap-2 rounded-tag border-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] ${
                activeStep >= 1 ? "border-inverse bg-card text-primary" : "border-border-primary bg-secondary text-tertiary"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-tag bg-accent font-display text-sm leading-none tabular-nums text-inverse">1</span>
              Shipping
            </div>
            <div className="h-px w-8 bg-border-primary" />
            <div
              className={`flex min-h-[44px] items-center gap-2 rounded-tag border-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] ${
                activeStep >= 2 ? "border-inverse bg-card text-primary" : "border-border-primary bg-secondary text-tertiary"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-tag font-display text-sm leading-none tabular-nums ${
                  activeStep >= 2 ? "bg-accent text-inverse" : "bg-border-primary text-primary"
                }`}
              >
                2
              </span>
              Payment
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
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
                  <h2 className="mb-6 flex items-center gap-2 font-display text-[29px] font-semibold uppercase leading-none text-primary">
                    <Truck className="h-5 w-5 text-accent" aria-hidden="true" />
                    Shipping Information
                  </h2>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {SHIPPING_FIELDS.map((field) => {
                      const fieldId = `checkout-${field.name}`;
                      const errorId = `${fieldId}-error`;
                      const hasError = Boolean(fieldErrors[field.name]);
                      return (
                        <div key={field.name} className={field.colSpan === 2 ? "md:col-span-2" : ""}>
                          <label htmlFor={fieldId} className={LABEL}>
                            {field.label}{" "}
                            <span className="text-accent" aria-hidden="true">*</span>
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
                            className={`${INPUT_BASE} ${
                              hasError ? "border-accent" : "border-border-primary focus:border-accent"
                            }`}
                          />
                          {hasError && (
                            <p id={errorId} role="alert" className="mt-1 text-xs font-bold text-accent">
                              {fieldErrors[field.name]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Inline next-step button so it's always visible on Step 1,
                      not just in the sidebar (which can scroll out of view). */}
                  <button type="submit" className={`mt-6 ${BTN_PRIMARY}`}>
                    Continue to Payment <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Step 2: Payment (only shown on Step 2) */}
              {activeStep === 2 && (
              <div>
                <h2 className="mb-6 flex items-center gap-2 font-display text-[29px] font-semibold uppercase leading-none text-primary">
                  <CreditCard className="h-5 w-5 text-accent" aria-hidden="true" />
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {/* Loading methods */}
                  {methodsLoading && (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-card border-2 border-border-primary bg-secondary p-8">
                      <Loader className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                        Loading payment methods...
                      </p>
                    </div>
                  )}

                  {/* Methods failed to load */}
                  {!methodsLoading && methodsError && (
                    <motion.div
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
                      className="rounded-tag border-2 border-accent bg-card p-4"
                    >
                      <div className="flex items-center gap-3 text-accent">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        <p className="text-sm font-bold">{methodsError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchPaymentMethods}
                        className={`mt-3 ${BTN_INLINE_ACCENT}`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Try again
                      </button>
                    </motion.div>
                  )}

                  {/* No methods configured */}
                  {!methodsLoading && !methodsError && paymentMethods.length === 0 && (
                    <div className="rounded-card border-2 border-border-primary bg-secondary p-5">
                      <p className="text-sm text-tertiary">
                        No payment methods are available right now. Please contact us to
                        complete your order.
                      </p>
                    </div>
                  )}

                  {/* Method selector */}
                  {!methodsLoading && paymentMethods.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      {paymentMethods.map((method) => {
                        const isActive = formData.paymentMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => selectPaymentMethod(method.id)}
                            aria-pressed={isActive}
                            className={`min-h-[44px] rounded-card border-2 p-4 text-left transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none ${
                              isActive
                                ? "border-inverse bg-sale-soft"
                                : "border-border-primary bg-card"
                            }`}
                          >
                            <div className="flex flex-col gap-2.5">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-tag border-2 border-inverse ${
                                  isActive ? "bg-accent text-inverse" : "bg-card text-primary"
                                }`}
                              >
                                {renderMethodIcon(method.type)}
                              </div>
                              <div>
                                <h3 className="font-display text-lg font-semibold uppercase leading-none text-primary">
                                  {method.label}
                                </h3>
                                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                                  {methodCaption(method.type)}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected method details */}
                  {selectedMethod && (
                    <div className="space-y-4 rounded-card border-2 border-inverse bg-card p-5">
                      {/* QR method */}
                      {selectedMethod.type === "qr" && (
                        <div className="flex flex-col items-center">
                          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                            Scan to Pay with {selectedMethod.label}
                          </p>
                          {selectedMethod.qrImage ? (
                            <div className="h-48 w-48 overflow-hidden rounded-tag border-2 border-inverse bg-card p-2">
                              <img
                                src={selectedMethod.qrImage}
                                className="h-full w-full object-contain"
                                alt={`${selectedMethod.label} payment QR code`}
                              />
                            </div>
                          ) : (
                            <div className="flex w-full items-start gap-3 rounded-tag border-2 border-dashed border-border-primary bg-secondary p-4">
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                              <p className="text-xs leading-relaxed text-tertiary">
                                QR not configured yet — please use the account details below to
                                send your payment.
                              </p>
                            </div>
                          )}
                          <p className="mt-3 font-display text-[29px] font-semibold uppercase leading-none tabular-nums text-accent">
                            Amount: Rs {payableTotal.toLocaleString()}
                          </p>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                            After payment, enter the transaction ID below
                          </p>

                          {(selectedMethod.accountName || selectedMethod.accountNumber) && (
                            <div className="mt-4 w-full border-t border-border-primary pt-4">
                              {selectedMethod.accountName && (
                                <div className={RECEIPT_ROW}>
                                  <span className="text-tertiary">Account Name</span>
                                  <span className="text-right font-bold text-primary">
                                    {selectedMethod.accountName}
                                  </span>
                                </div>
                              )}
                              {selectedMethod.accountNumber && (
                                <div className={RECEIPT_ROW}>
                                  <span className="text-tertiary">Account Number</span>
                                  <span className="text-right font-bold tabular-nums text-primary">
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
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-tag border-2 border-inverse bg-accent text-inverse">
                            <Landmark className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="flex-1">
                            <h3 className="mb-3 font-display text-lg font-semibold uppercase leading-none tabular-nums text-primary">
                              Transfer Rs {payableTotal.toLocaleString()} to our account
                            </h3>
                            <div>
                              {[
                                { label: "Bank Name", value: selectedMethod.bankName },
                                { label: "Branch", value: selectedMethod.branch },
                                { label: "Account Name", value: selectedMethod.accountName },
                                { label: "Account Number", value: selectedMethod.accountNumber },
                              ]
                                .filter((row) => row.value)
                                .map((row) => (
                                  <div key={row.label} className={RECEIPT_ROW}>
                                    <span className="text-tertiary">{row.label}</span>
                                    <span className="text-right font-bold tabular-nums text-primary">
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
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-tag border-2 border-inverse bg-accent text-inverse">
                            <Banknote className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="flex-1">
                            <h3 className="mb-1 font-display text-lg font-semibold uppercase leading-none text-primary">
                              Pay with cash on delivery
                            </h3>
                            <p className="text-xs leading-relaxed text-tertiary">
                              Keep the exact amount of{" "}
                              <span className="font-bold tabular-nums text-primary">
                                Rs {payableTotal.toLocaleString()}
                              </span>{" "}
                              ready. Our delivery partner will collect payment when your order
                              arrives. No transaction ID required.
                            </p>
                            <ul className="mt-3 space-y-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-3.5 w-3.5 text-pitch" aria-hidden="true" /> Inspect before you pay
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-3.5 w-3.5 text-pitch" aria-hidden="true" /> Cash only at delivery
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-3.5 w-3.5 text-pitch" aria-hidden="true" /> Keep your phone reachable
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Instructions — shown for every method */}
                      {selectedMethod.instructions && (
                        <p className="border-t border-border-primary pt-3 text-xs leading-relaxed text-tertiary">
                          {selectedMethod.instructions}
                        </p>
                      )}

                      {/* Proof of payment — only for methods that require it */}
                      {requiresProof && (
                        <div className="space-y-4 border-t border-border-primary pt-3">
                          {/* Either field satisfies the check, so neither is marked
                              required on its own — the requirement is the pair. */}
                          <p className="text-xs text-tertiary">
                            Send us proof of your payment:{" "}
                            <span className="font-bold text-primary">
                              a Transaction ID or a screenshot
                            </span>{" "}
                            — either one is enough.{" "}
                            <span className="text-accent" aria-hidden="true">*</span>
                          </p>

                          <div>
                            <label htmlFor="checkout-transactionId" className={LABEL}>
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
                              className={`${INPUT_BASE} ${
                                fieldErrors.paymentProof
                                  ? "border-accent"
                                  : "border-border-primary focus:border-accent"
                              }`}
                            />
                          </div>

                          {/* Payment Screenshot Upload */}
                          <div>
                            <label htmlFor="checkout-paymentScreenshot" className={LABEL}>
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
                                className="w-full rounded-tag border-2 border-border-primary bg-card px-4 py-3 text-sm text-primary transition-all duration-snap ease-snap file:mr-3 file:min-h-[32px] file:rounded-tag file:border-0 file:bg-inverse file:px-3 file:text-xs file:font-bold file:uppercase file:tracking-[0.12em] file:text-inverse focus:border-accent"
                              />
                            </div>
                            {screenshotPreview && (
                              <div className="relative mt-3 inline-block">
                                <img
                                  src={screenshotPreview}
                                  alt="Payment screenshot you selected"
                                  className="h-40 w-32 rounded-tag border-2 border-inverse object-cover"
                                />
                                <button
                                  type="button"
                                  aria-label="Remove payment screenshot"
                                  onClick={() => { setPaymentScreenshot(null); setScreenshotPreview(null); }}
                                  className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-tag border-2 border-inverse bg-accent font-display text-xl leading-none text-inverse transition-all duration-snap ease-snap hover:bg-accent-hover"
                                >
                                  <span aria-hidden="true">×</span>
                                </button>
                              </div>
                            )}
                            <p
                              id="checkout-screenshot-hint"
                              className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary"
                            >
                              Upload screenshot of your payment confirmation
                            </p>
                          </div>

                          {/* Rendered beside the fields it refers to, not at the
                              top of the page the customer scrolled away from. */}
                          {fieldErrors.paymentProof && (
                            <p
                              id="checkout-proof-error"
                              role="alert"
                              className="flex items-center gap-1.5 text-xs font-bold text-accent"
                            >
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
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
                  className={`${BTN_PRIMARY} disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Placing your order...
                    </>
                  ) : (
                    <>
                      <span className="tabular-nums">Place Order · Rs {payableTotal.toLocaleString()}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar — printed receipt */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-card border-2 border-inverse bg-card p-6">
              <p className="eyebrow mb-4">Receipt</p>
              <h2 className="mb-6 flex items-center gap-2 font-display text-[29px] font-semibold uppercase leading-none text-primary">
                <Package className="h-5 w-5 text-accent" aria-hidden="true" />
                Order Summary
              </h2>

              {/* Items */}
              <div className="mb-6 max-h-[280px] overflow-y-auto scrollbar-thin">
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.variantId}`}
                    className="flex gap-3 border-b border-border-primary py-3 first:pt-0"
                  >
                    <div className="h-16 w-14 shrink-0 overflow-hidden rounded-tag border-2 border-inverse bg-secondary">
                      <img
                        src={pickProductImageUrl(item.images)}
                        className="h-full w-full object-cover"
                        alt={item.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.Brand?.name && (
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                          {item.Brand.name}
                        </p>
                      )}
                      <h3 className="truncate font-display text-lg font-semibold uppercase leading-none text-primary">
                        {item.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {item.selectedSize && (
                          <span className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded-tag border-[1.5px] border-inverse px-1.5 font-display text-sm font-semibold uppercase leading-none tabular-nums text-primary">
                            {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="rounded-tag border-[1.5px] border-border-primary px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                            {item.selectedColor}
                          </span>
                        )}
                        <span className="rounded-tag border-[1.5px] border-border-primary px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-tertiary">
                          Qty {item.quantity}
                        </span>
                      </div>
                      <p className="mt-1 font-display text-lg font-semibold leading-none tabular-nums text-primary">
                        Rs {((item.variantPrice || item.price || 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <dl className="border-t border-border-primary pt-4">
                <div className={RECEIPT_ROW}>
                  <dt className="text-tertiary">Subtotal</dt>
                  <dd className="font-display text-lg font-semibold leading-none tabular-nums text-primary">
                    Rs {cartTotal.toLocaleString()}
                  </dd>
                </div>
                <div className={RECEIPT_ROW}>
                  <dt className="text-tertiary">
                    Delivery
                    {formData.city && (
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
                        {" "}· {getDeliveryLabel(formData.city)}
                      </span>
                    )}
                  </dt>
                  <dd className="font-display text-lg font-semibold leading-none tabular-nums text-primary">
                    {formData.city ? `Rs ${deliveryCharge.toLocaleString()}` : "Enter city"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-t-2 border-inverse pt-3">
                  <dt className="font-display text-xl font-semibold uppercase leading-none text-primary">Total</dt>
                  <dd className="font-display text-[34px] font-semibold leading-none tabular-nums text-primary">
                    Rs {payableTotal.toLocaleString()}
                  </dd>
                </div>
              </dl>

              {/* Submit Button */}
              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className={`mt-6 ${BTN_PRIMARY}`}
              >
                {loading ? (
                  <Loader className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : activeStep === 1 ? (
                  <>Continue to Payment <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                ) : (
                  <>Place Order <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2">
                <Banknote className="h-3.5 w-3.5 text-tertiary" aria-hidden="true" />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                  COD available · Delivery all over Nepal
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
