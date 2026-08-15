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
import { orderService } from "../../services/orderService";
import api from "../../services/api";
import { motion } from "framer-motion";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  esewa: "eSewa",
  khalti: "Khalti",
  bank: "Bank Transfer",
  cod: "Cash on Delivery",
  qr: "QR / Manual", // legacy value on older orders
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [notFound, setNotFound] = useState(false);

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
    } catch (error: any) {
      console.error("Failed to fetch order details:", error);
      // A genuine 404 means the order really is not there; anything else
      // (network drop, 500, timeout) must not be reported as "not found".
      if (error?.response?.status === 404) {
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
    if (proofSubmitting) return;

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
    } catch (err: any) {
      setProofError(
        err?.response?.data?.message ||
          "We could not upload your payment proof. Please check your connection and try again."
      );
    } finally {
      setProofSubmitting(false);
    }
  };

  const handleProofFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProofFile(e.target.files?.[0] ?? null);
    setProofError(null);
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "processing": case "preparation": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "shipped": case "ontheway": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "cancelled": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-secondary text-secondary border-border-primary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-secondary rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-secondary rounded-xl animate-pulse" />
          <div className="h-64 bg-secondary rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (fetchFailed && !order) {
    return (
      <div className="text-center py-16">
        <WifiOff className="w-12 h-12 text-muted mx-auto mb-4" />
        <h2 className="text-lg font-bold text-primary">Couldn't load this order</h2>
        <p className="text-sm text-tertiary mt-1">
          Your order is safe — we just couldn't reach the server. Check your connection and try again.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={fetchOrder}
            className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/dashboard/orders")}
            className="px-5 py-2 bg-secondary text-primary border border-border-primary rounded-xl text-sm font-bold"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 text-muted mx-auto mb-4" />
        <h2 className="text-lg font-bold text-primary">Order not found</h2>
        <p className="text-sm text-tertiary mt-1">Unable to find order details for this ID.</p>
        <button
          onClick={() => navigate("/dashboard/orders")}
          className="mt-4 px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold"
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
        <label
          htmlFor="proof-transaction-id"
          className="block text-[10px] font-bold uppercase text-muted mb-1"
        >
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
          className="w-full px-3 py-2 bg-card border border-border-primary rounded-lg text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent disabled:opacity-60"
        />
      </div>
      <div>
        <label
          htmlFor="proof-screenshot"
          className="block text-[10px] font-bold uppercase text-muted mb-1"
        >
          Payment screenshot
        </label>
        <input
          id="proof-screenshot"
          type="file"
          accept="image/*"
          onChange={handleProofFileChange}
          disabled={proofSubmitting}
          className="w-full text-xs text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-secondary file:text-primary file:text-xs file:font-bold disabled:opacity-60"
        />
      </div>

      {proofError && (
        <p role="alert" className="text-xs font-semibold text-red-500">
          {proofError}
        </p>
      )}

      <button
        type="submit"
        disabled={proofSubmitting}
        className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {proofSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <UploadCloud className="w-4 h-4" />
            {missingProof ? "Submit Payment Proof" : "Re-submit Payment Proof"}
          </>
        )}
      </button>
    </form>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/dashboard/orders")}
          className="flex items-center gap-1 text-sm text-tertiary hover:text-accent transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Orders
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-primary">
              Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(order.createdAt).toLocaleString()}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Payment rejected — explain and let the customer send new proof */}
          {paymentRejected && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-red-500">We couldn't verify your payment</h3>
                  <p className="text-xs text-secondary mt-1">
                    Our team reviewed the payment proof for this order and could not confirm it, so the
                    order is on hold. Nothing has been charged by us — send us the correct details below
                    and we'll check again.
                  </p>

                  {order.paymentRejectionReason && (
                    <div className="mt-3 bg-card border border-border-primary rounded-lg p-3">
                      <p className="text-[10px] font-bold uppercase text-muted">Reason given</p>
                      <p className="text-xs text-primary mt-1 whitespace-pre-line">
                        {order.paymentRejectionReason}
                      </p>
                    </div>
                  )}

                  {(order.paymentScreenshot || order.paymentPid) && (
                    <div className="mt-3 flex items-center gap-3">
                      {order.paymentScreenshot && (
                        <a
                          href={order.paymentScreenshot}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-14 h-14 rounded-lg overflow-hidden border border-border-primary flex-shrink-0"
                        >
                          <img
                            src={order.paymentScreenshot}
                            alt="Payment proof you sent"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      )}
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase text-muted">What we received</p>
                        <p className="text-xs text-secondary truncate">
                          {order.paymentPid ? `Transaction ID: ${order.paymentPid}` : "Screenshot only"}
                        </p>
                      </div>
                    </div>
                  )}

                  {proofResubmitForm}
                </div>
              </div>
            </motion.div>
          )}

          {/* Proof never arrived — the checkout upload failed, order is stuck until it's sent */}
          {missingProof && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UploadCloud className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-amber-600">
                    We haven't received your payment proof
                  </h3>
                  <p className="text-xs text-secondary mt-1">
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
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-amber-600">Awaiting payment verification</h3>
                  <p className="text-xs text-secondary mt-1">
                    Payments here are checked by a person, not automatically. Someone from our team is
                    reviewing what you sent and your order moves forward once it's confirmed. You don't
                    need to pay again or send anything else in the meantime.
                  </p>

                  {(order.paymentScreenshot || order.paymentPid) && (
                    <div className="mt-3 flex items-center gap-3">
                      {order.paymentScreenshot && (
                        <a
                          href={order.paymentScreenshot}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-14 h-14 rounded-lg overflow-hidden border border-border-primary flex-shrink-0"
                        >
                          <img
                            src={order.paymentScreenshot}
                            alt="Payment proof you sent"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      )}
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase text-muted">What we received</p>
                        <p className="text-xs text-secondary truncate">
                          {order.paymentPid ? `Transaction ID: ${order.paymentPid}` : "Screenshot only"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" />
            Order Items
          </h3>

          <div className="space-y-3">
            {order.OrderItems?.map((item: any) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-4 rounded-xl border border-border-primary flex items-center gap-4"
              >
                <div className="w-16 h-18 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                  {item.Product?.ProductImages?.[0]?.url ? (
                    <img
                      src={item.Product.ProductImages[0].url}
                      alt={item.productName || item.Product?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-primary truncate">
                    {item.productName || item.Product?.name || "Product"}
                  </h4>
                  <div className="flex gap-2 mt-1">
                    {item.size && (
                      <span className="text-[10px] text-muted bg-secondary px-2 py-0.5 rounded">
                        Size: {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="text-[10px] text-muted bg-secondary px-2 py-0.5 rounded">
                        Color: {item.color}
                      </span>
                    )}
                    <span className="text-[10px] text-muted bg-secondary px-2 py-0.5 rounded">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary">
                  Rs {item.price?.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Order Timeline */}
          <div className="bg-card p-5 rounded-xl border border-border-primary mt-6">
            <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-accent" />
              Order Status
            </h3>
            <div className="space-y-4">
              {order.StatusHistories && order.StatusHistories.length > 0 ? (
                order.StatusHistories.map((entry: any, idx: number) => {
                  const isLast = idx === order.StatusHistories.length - 1;
                  const statusColors: Record<string, { bg: string; icon: string }> = {
                    pending: { bg: "bg-gray-500/10", icon: "text-gray-500" },
                    processing: { bg: "bg-blue-500/10", icon: "text-blue-500" },
                    preparation: { bg: "bg-blue-500/10", icon: "text-blue-500" },
                    shipped: { bg: "bg-yellow-500/10", icon: "text-yellow-500" },
                    ontheway: { bg: "bg-yellow-500/10", icon: "text-yellow-500" },
                    delivered: { bg: "bg-green-500/10", icon: "text-green-500" },
                    cancelled: { bg: "bg-red-500/10", icon: "text-red-500" },
                  };
                  const colors = statusColors[entry.status] || statusColors.pending;
                  return (
                    <div key={entry.id || idx} className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        {isLast ? (
                          <CheckCircle2 className={`w-4 h-4 ${colors.icon}`} />
                        ) : (
                          <Clock className={`w-4 h-4 ${colors.icon}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-primary capitalize">{entry.status}</p>
                          <p className="text-[10px] text-muted">{new Date(entry.createdAt).toLocaleString()}</p>
                        </div>
                        {entry.note && <p className="text-[10px] text-tertiary mt-0.5">{entry.note}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary">Order Placed</p>
                    <p className="text-[10px] text-muted">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Address & Payment */}
        <div className="space-y-4">
          {/* Shipping Address */}
          <div className="bg-card p-5 rounded-xl border border-border-primary">
            <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              Shipping Address
            </h3>
            <div className="text-sm text-secondary space-y-1">
              <p className="font-semibold text-primary">{order.firstName} {order.lastName}</p>
              <p>{order.addressLine}</p>
              <p>{order.city}, {order.state} {order.zipcode}</p>
              <p className="text-muted">{order.phoneNumber}</p>
              <p className="text-muted">{order.email}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-card p-5 rounded-xl border border-border-primary">
            <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" />
              Payment
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Method</span>
                <span className="font-semibold text-primary">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Status</span>
                <span
                  className={`font-semibold capitalize ${
                    paymentRejected
                      ? "text-red-500"
                      : paymentStatus === "paid"
                        ? "text-green-600"
                        : "text-primary"
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>
              {order.subtotal != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Subtotal</span>
                  <span className="font-semibold text-primary">Rs {order.subtotal.toLocaleString()}</span>
                </div>
              )}
              {order.deliveryCharge != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Delivery</span>
                  <span className="font-semibold text-primary">Rs {order.deliveryCharge.toLocaleString()}</span>
                </div>
              )}
              <hr className="border-border-primary" />
              <div className="flex justify-between">
                <span className="font-medium text-primary">Total</span>
                <span className="text-xl font-black text-primary">
                  Rs {order.totalPrice?.toLocaleString()}
                </span>
              </div>
            </div>
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
                  } catch (err: any) {
                    alert(err.response?.data?.message || "Failed to cancel order. Please contact support.");
                  }
                }}
                className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
              >
                Cancel Order
              </button>
            )}

            {/* Contact Support */}
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "9779748477628"}?text=${encodeURIComponent(`Hi! I need help with my order #${order.orderNumber || order.id.slice(-8).toUpperCase()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#25D366] hover:text-white transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
