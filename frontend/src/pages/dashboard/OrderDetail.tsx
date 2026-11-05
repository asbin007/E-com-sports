import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  ChevronLeft,
  MapPin,
  Truck,
  ShieldCheck,
  Clock,
  CreditCard,
  CheckCircle2,
  MessageCircle,
  AlertTriangle,
  UploadCloud,
  Loader2,
  WifiOff,
} from "lucide-react";
import { orderService, type Order } from "../../services/orderService";
import api from "../../services/api";
import { getApiErrorMessage, getApiErrorStatus } from "../../utils/apiError";
import { motion, useReducedMotion } from "framer-motion";
import { whatsappUrl } from "../../data/store";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  esewa: "eSewa",
  khalti: "Khalti",
  bank: "Bank Transfer",
  cod: "Cash on Delivery",
  qr: "QR / Manual", // legacy value on older orders
};

const MICRO = "text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary";
const CHIP =
  "rounded-tag border-[1.5px] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]";
const CARD = "rounded-card border-2 border-inverse bg-card p-5";
const RECEIPT_ROW = "flex items-baseline justify-between gap-3 border-b border-border-primary py-2.5 text-sm";
const BTN_PRIMARY =
  "flex w-full items-center justify-center gap-2 rounded-tag border-2 border-inverse bg-accent py-3 font-display text-lg uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:border-border-primary disabled:bg-secondary disabled:text-muted disabled:shadow-none";
const BTN_INLINE_ACCENT =
  "inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-accent px-5 font-display text-base uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";
const BTN_INLINE_SECONDARY =
  "inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-transparent px-5 font-display text-base uppercase leading-none tracking-[0.04em] text-primary transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const reduce = useReducedMotion();

  // Payment proof re-submission (shown when an admin rejected the payment)
  const [proofTransactionId, setProofTransactionId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setFetchFailed(false);
    setNotFound(false);
    try {
      const data = await orderService.getOrderById(id);
      setOrder(data);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      // A genuine 404 means the order really is not there; anything else
      // (network drop, 500, timeout) must not be reported as "not found".
      if (getApiErrorStatus(error) === 404) {
        setNotFound(true);
      } else {
        setFetchFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleProofResubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (proofSubmitting || !order) return;

    const transactionId = proofTransactionId.trim();
    if (!transactionId && !proofFile) {
      setProofError("Add the transaction ID or a payment screenshot so we can check it again.");
      return;
    }

    setProofSubmitting(true);
    setProofError(null);
    try {
      await orderService.uploadPaymentProof(order.id, transactionId, proofFile ?? undefined);
      setProofTransactionId("");
      setProofFile(null);
      await fetchOrder();
    } catch (err) {
      setProofError(
        getApiErrorMessage(err, "We could not upload your payment proof. Please check your connection and try again.")
      );
    } finally {
      setProofSubmitting(false);
    }
  };

  const handleProofFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProofFile(e.target.files?.[0] ?? null);
    setProofError(null);
  };

  // Semantic, not accent: delivered reads pitch, in-flight and pending read
  // sale, cancelled reads accent crimson.
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "text-pitch border-pitch";
      case "processing": case "preparation": return "text-sale border-sale";
      case "shipped": case "ontheway": return "text-sale border-sale";
      case "pending": return "text-sale border-sale";
      case "cancelled": return "text-accent border-accent";
      default: return "text-tertiary border-border-primary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-8 w-48 rounded-tag border-2 border-border-primary bg-secondary" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-64 rounded-card border-2 border-border-primary bg-secondary lg:col-span-2" />
          <div className="h-64 rounded-card border-2 border-border-primary bg-secondary" />
        </div>
      </div>
    );
  }

  if (fetchFailed && !order) {
    return (
      <div className="py-16 text-center">
        <WifiOff className="mx-auto mb-4 h-12 w-12 text-tertiary" aria-hidden="true" />
        <h1 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
          Couldn't load this order
        </h1>
        <p className="mt-1 text-sm text-tertiary">
          Your order is safe — we just couldn't reach the server. Check your connection and try again.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={fetchOrder} className={BTN_INLINE_ACCENT}>
            Try Again
          </button>
          <button onClick={() => navigate("/dashboard/orders")} className={BTN_INLINE_SECONDARY}>
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-tertiary" aria-hidden="true" />
        <h1 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
          Order not found
        </h1>
        <p className="mt-1 text-sm text-tertiary">Unable to find order details for this ID.</p>
        <button
          onClick={() => navigate("/dashboard/orders")}
          className={`mt-4 ${BTN_INLINE_ACCENT}`}
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const paymentStatus = order.Payment?.paymentStatus || order.paymentStatus || "pending";
  const requiresProof = order.paymentMethod !== "cod";
  const paymentRejected = paymentStatus === "failed";
  // Proof never arrived (e.g. the upload failed during checkout) — the order sits
  // pending with nothing for the admin to review, so the customer must send it.
  const missingProof =
    paymentStatus === "pending" &&
    requiresProof &&
    !order.paymentScreenshot &&
    !order.paymentPid;
  const awaitingVerification =
    paymentStatus === "pending" && requiresProof && !missingProof;

  const proofResubmitForm = (
    <form onSubmit={handleProofResubmit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="proof-transaction-id" className={`mb-1 block ${MICRO}`}>
          Transaction ID
        </label>
        <input
          id="proof-transaction-id"
          type="text"
          value={proofTransactionId}
          onChange={(e) => {
            setProofTransactionId(e.target.value);
            setProofError(null);
          }}
          disabled={proofSubmitting}
          placeholder="Reference code from eSewa / Khalti / your bank"
          className="w-full min-h-[44px] rounded-tag border-2 border-border-primary bg-card px-3 py-2 text-sm text-primary transition-all duration-snap ease-snap placeholder:text-muted focus:border-accent disabled:bg-secondary disabled:text-muted"
        />
      </div>
      <div>
        <label htmlFor="proof-screenshot" className={`mb-1 block ${MICRO}`}>
          Payment screenshot
        </label>
        <input
          id="proof-screenshot"
          type="file"
          accept="image/*"
          onChange={handleProofFileChange}
          disabled={proofSubmitting}
          className="w-full min-h-[44px] rounded-tag border-2 border-border-primary bg-card px-3 py-2 text-xs text-primary transition-all duration-snap ease-snap file:mr-3 file:min-h-[32px] file:rounded-tag file:border-0 file:bg-inverse file:px-3 file:text-xs file:font-bold file:uppercase file:tracking-[0.12em] file:text-inverse focus:border-accent disabled:bg-secondary disabled:text-muted"
        />
      </div>

      {proofError && (
        <p role="alert" className="text-xs font-bold text-accent">
          {proofError}
        </p>
      )}

      <button
        type="submit"
        disabled={proofSubmitting}
        className={`${BTN_PRIMARY} disabled:cursor-not-allowed`}
      >
        {proofSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Uploading...
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            {missingProof ? "Submit Payment Proof" : "Re-submit Payment Proof"}
          </>
        )}
      </button>
    </form>
  );

  const receivedProof = (
    <div className="mt-3 flex items-center gap-3">
      {order.paymentScreenshot && (
        <a
          href={order.paymentScreenshot}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-14 w-14 flex-shrink-0 overflow-hidden rounded-tag border-2 border-inverse"
        >
          <img
            src={order.paymentScreenshot}
            alt="Payment proof you sent"
            className="h-full w-full object-cover"
          />
        </a>
      )}
      <div className="min-w-0">
        <p className={MICRO}>What we received</p>
        <p className="truncate text-xs text-primary">
          {order.paymentPid ? `Transaction ID: ${order.paymentPid}` : "Screenshot only"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/dashboard/orders")}
          className={`mb-4 flex min-h-[44px] items-center gap-1 ${MICRO} transition-colors duration-snap ease-snap hover:text-accent`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to Orders
        </button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow mb-2">Order</p>
            <h1 className="font-display text-[34px] font-semibold uppercase leading-none tabular-nums text-primary">
              Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
            </h1>
            <div className="mt-1.5 flex items-center gap-3">
              <span className={`flex items-center gap-1 tabular-nums ${MICRO}`}>
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {new Date(order.createdAt).toLocaleString()}
              </span>
              <span className={`${CHIP} ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="space-y-4 lg:col-span-2">
          {/* Payment rejected — explain and let the customer send new proof */}
          {paymentRejected && (
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
              className="rounded-card border-2 border-accent bg-card p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-tag border-2 border-accent bg-card">
                  <AlertTriangle className="h-5 w-5 text-accent" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-semibold uppercase leading-none text-accent">
                    We couldn't verify your payment
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-tertiary">
                    Our team reviewed the payment proof for this order and could not confirm it, so the
                    order is on hold. Nothing has been charged by us — send us the correct details below
                    and we'll check again.
                  </p>

                  {order.paymentRejectionReason && (
                    <div className="mt-3 rounded-tag border-2 border-border-primary bg-secondary p-3">
                      <p className={MICRO}>Reason given</p>
                      <p className="mt-1 whitespace-pre-line text-xs text-primary">
                        {order.paymentRejectionReason}
                      </p>
                    </div>
                  )}

                  {(order.paymentScreenshot || order.paymentPid) && receivedProof}

                  {proofResubmitForm}
                </div>
              </div>
            </motion.div>
          )}

          {/* Proof never arrived — the checkout upload failed, order is stuck until it's sent */}
          {missingProof && (
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
              className="rounded-card border-2 border-sale bg-sale-soft p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-tag border-2 border-sale bg-card">
                  <UploadCloud className="h-5 w-5 text-sale" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-semibold uppercase leading-none text-primary">
                    We haven't received your payment proof
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-primary">
                    Your order was placed, but no payment screenshot or transaction ID reached us —
                    this can happen if the upload failed during checkout. If you already paid,
                    don't pay again: just send the proof below and our team will verify it.
                  </p>
                  {proofResubmitForm}
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment submitted — waiting on a human to check it */}
          {awaitingVerification && (
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
              className="rounded-card border-2 border-sale bg-sale-soft p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-tag border-2 border-sale bg-card">
                  <ShieldCheck className="h-5 w-5 text-sale" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-semibold uppercase leading-none text-primary">
                    Awaiting payment verification
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-primary">
                    Payments here are checked by a person, not automatically. Someone from our team is
                    reviewing what you sent and your order moves forward once it's confirmed. You don't
                    need to pay again or send anything else in the meantime.
                  </p>

                  {(order.paymentScreenshot || order.paymentPid) && receivedProof}
                </div>
              </div>
            </motion.div>
          )}

          <h2 className="flex items-center gap-2 font-display text-[29px] font-semibold uppercase leading-none text-primary">
            <Package className="h-5 w-5 text-accent" aria-hidden="true" />
            Order Items
          </h2>

          <div className="space-y-3">
            {order.OrderItems?.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-card border-2 border-inverse bg-card p-4"
              >
                <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-tag border-2 border-inverse bg-secondary">
                  {item.Product?.ProductImages?.[0]?.url ? (
                    <img
                      src={item.Product.ProductImages[0].url}
                      alt={item.productName || item.Product?.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-tertiary">
                      <Package className="h-5 w-5" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-xl font-semibold uppercase leading-none text-primary">
                    {item.productName || item.Product?.name || "Product"}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {item.size && (
                      <span className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded-tag border-[1.5px] border-inverse px-1.5 font-display text-sm font-semibold uppercase leading-none tabular-nums text-primary">
                        {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className={`${CHIP} border-border-primary text-tertiary`}>
                        {item.color}
                      </span>
                    )}
                    <span className={`${CHIP} border-border-primary tabular-nums text-tertiary`}>
                      Qty {item.quantity}
                    </span>
                  </div>
                </div>
                <p className="font-display text-xl font-semibold leading-none tabular-nums text-primary">
                  Rs {item.price?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Order Timeline */}
          <div className={`mt-6 ${CARD}`}>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold uppercase leading-none text-primary">
              <Truck className="h-4 w-4 text-accent" aria-hidden="true" />
              Order Status
            </h2>
            <div className="space-y-4">
              {order.StatusHistories && order.StatusHistories.length > 0 ? (
                order.StatusHistories.map((entry, idx, histories) => {
                  const isLast = idx === histories.length - 1;
                  const statusTone: Record<string, string> = {
                    pending: "text-sale border-sale",
                    processing: "text-sale border-sale",
                    preparation: "text-sale border-sale",
                    shipped: "text-sale border-sale",
                    ontheway: "text-sale border-sale",
                    delivered: "text-pitch border-pitch",
                    cancelled: "text-accent border-accent",
                  };
                  const tone = statusTone[entry.status] || statusTone.pending;
                  return (
                    <div key={entry.id || idx} className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-tag border-2 bg-card ${tone}`}
                      >
                        {isLast ? (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Clock className="h-4 w-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-display text-lg font-semibold uppercase leading-none text-primary">
                            {entry.status}
                          </p>
                          <p className={`tabular-nums ${MICRO}`}>
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {entry.note && <p className="mt-0.5 text-xs text-tertiary">{entry.note}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-tag border-2 border-pitch bg-card">
                    <CheckCircle2 className="h-4 w-4 text-pitch" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold uppercase leading-none text-primary">
                      Order Placed
                    </p>
                    <p className={`tabular-nums ${MICRO}`}>
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Address & Payment */}
        <div className="space-y-4">
          {/* Shipping Address */}
          <div className={CARD}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold uppercase leading-none text-primary">
              <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
              Shipping Address
            </h2>
            <div className="space-y-1 text-sm text-primary">
              <p className="font-bold">{order.firstName} {order.lastName}</p>
              <p className="text-tertiary">{order.addressLine}</p>
              <p className="text-tertiary">{order.city}, {order.state} {order.zipcode}</p>
              <p className="tabular-nums text-tertiary">{order.phoneNumber}</p>
              <p className="text-tertiary">{order.email}</p>
            </div>
          </div>

          {/* Payment — printed receipt */}
          <div className={CARD}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold uppercase leading-none text-primary">
              <CreditCard className="h-4 w-4 text-accent" aria-hidden="true" />
              Payment
            </h2>
            <dl>
              <div className={RECEIPT_ROW}>
                <dt className="text-tertiary">Method</dt>
                <dd className="font-bold text-primary">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod ?? ""] || order.paymentMethod}
                </dd>
              </div>
              <div className={RECEIPT_ROW}>
                <dt className="text-tertiary">Status</dt>
                <dd
                  className={`font-bold capitalize ${
                    paymentRejected
                      ? "text-accent"
                      : paymentStatus === "paid"
                        ? "text-pitch"
                        : "text-sale"
                  }`}
                >
                  {paymentStatus}
                </dd>
              </div>
              {order.subtotal != null && (
                <div className={RECEIPT_ROW}>
                  <dt className="text-tertiary">Subtotal</dt>
                  <dd className="font-display text-lg font-semibold leading-none tabular-nums text-primary">
                    Rs {order.subtotal.toLocaleString()}
                  </dd>
                </div>
              )}
              {order.deliveryCharge != null && (
                <div className={RECEIPT_ROW}>
                  <dt className="text-tertiary">Delivery</dt>
                  <dd className="font-display text-lg font-semibold leading-none tabular-nums text-primary">
                    Rs {order.deliveryCharge.toLocaleString()}
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t-2 border-inverse pt-3">
                <dt className="font-display text-xl font-semibold uppercase leading-none text-primary">
                  Total
                </dt>
                <dd className="font-display text-[29px] font-semibold leading-none tabular-nums text-primary">
                  Rs {order.totalPrice?.toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {/* Cancel Order — only if not delivered/cancelled/ontheway */}
            {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && order.orderStatus !== "ontheway" && (
              <button
                onClick={async () => {
                  if (!confirm("Are you sure you want to cancel this order? This cannot be undone.")) return;
                  try {
                    await api.put(`/orders/${order.id}/cancel`);
                    alert("Order cancelled successfully. Refund will be processed if payment was made.");
                    window.location.reload();
                  } catch (err) {
                    alert(getApiErrorMessage(err, "Failed to cancel order. Please contact support."));
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-tag border-2 border-accent bg-transparent py-3 font-display text-lg uppercase leading-none tracking-[0.04em] text-accent transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent hover:text-inverse hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
              >
                Cancel Order
              </button>
            )}

            {/* Contact Support */}
            <a
              href={whatsappUrl(`Hi! I need help with my order #${order.orderNumber || order.id.slice(-8).toUpperCase()}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-tag border-2 border-pitch bg-transparent py-3 font-display text-lg uppercase leading-none tracking-[0.04em] text-pitch transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
