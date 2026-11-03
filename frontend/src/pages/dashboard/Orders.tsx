import { useCallback, useEffect, useState } from "react";
import {
  Package,
  Search,
  Inbox,
  ChevronRight,
  MessageCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { orderService, type Order } from "../../services/orderService";
import { motion, useReducedMotion } from "framer-motion";
import { whatsappUrl } from "../../data/store";
import { OrderListSkeleton } from "../../components/ui/Skeleton";

const CHIP =
  "rounded-tag border-[1.5px] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]";
const FIELD =
  "w-full min-h-[44px] rounded-tag border-2 border-border-primary bg-card px-3 py-3 text-sm text-primary transition-all duration-snap ease-snap placeholder:text-muted focus:border-accent";
const BTN_INLINE_ACCENT =
  "inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-accent px-6 font-display text-lg uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";
const BTN_INLINE_SECONDARY =
  "inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-transparent px-6 font-display text-lg uppercase leading-none tracking-[0.04em] text-primary transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";

// Mirrors the backend OrderStatus enum (backend/src/services/types.ts).
const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "preparation", label: "Preparation" },
  { value: "shipped", label: "Shipped" },
  { value: "ontheway", label: "On the way" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

type PaymentState = {
  label: string;
  className: string;
  icon: typeof Clock;
  urgent: boolean;
};

/**
 * Payment is verified by hand, so an order sits in "awaiting verification" for a
 * while and a rejected payment is the only state that requires the customer to act.
 */
type OrderLike = {
  Payment?: { paymentStatus?: string | null } | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
};

const getPaymentState = (order: OrderLike): PaymentState => {
  const status = String(
    order?.Payment?.paymentStatus || order?.paymentStatus || "pending"
  ).toLowerCase();
  const isCod = String(order?.paymentMethod || "").toLowerCase() === "cod";

  if (status === "failed") {
    return {
      label: "Payment rejected",
      className: "text-accent border-accent",
      icon: AlertTriangle,
      urgent: true,
    };
  }
  if (status === "paid") {
    return {
      label: "Payment verified",
      className: "text-pitch border-pitch",
      icon: CheckCircle2,
      urgent: false,
    };
  }
  if (status === "refunded") {
    return {
      label: "Refunded",
      className: "text-tertiary border-border-primary",
      icon: RotateCcw,
      urgent: false,
    };
  }
  if (isCod) {
    return {
      label: "Pay on delivery",
      className: "text-tertiary border-border-primary",
      icon: Wallet,
      urgent: false,
    };
  }
  return {
    label: "Awaiting verification",
    className: "text-marigold border-marigold bg-marigold-soft",
    icon: Clock,
    urgent: false,
  };
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const reduce = useReducedMotion();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch order history:", err);
      setOrders([]);
      setError("We couldn't load your orders. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Semantic, not accent: delivered reads pitch, in-flight and pending read
  // marigold, cancelled reads accent crimson.
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "text-pitch border-pitch";
      case "processing": case "preparation": return "text-marigold border-marigold";
      case "shipped": case "ontheway": return "text-marigold border-marigold";
      case "pending": return "text-marigold border-marigold";
      case "cancelled": return "text-accent border-accent";
      default: return "text-tertiary border-border-primary";
    }
  };

  const hasFilters = Boolean(search) || statusFilter !== "all";

  const filteredOrders = orders
    .filter((order) => {
      if (statusFilter !== "all") {
        if (String(order.orderStatus || "").toLowerCase() !== statusFilter) return false;
      }
      if (!search) return true;
      const q = search.toLowerCase().trim();
      return (
        // orderNumber is the identifier actually printed on the card below.
        String(order.orderNumber || "").toLowerCase().includes(q) ||
        order.id?.toLowerCase().includes(q) ||
        order.orderStatus?.toLowerCase().includes(q) ||
        order.firstName?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Order history</p>
          <h1 className="font-display text-[34px] font-semibold uppercase leading-none text-primary">
            My Orders
          </h1>
          <p className="mt-1 text-sm text-tertiary">Track and manage your orders</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="w-full sm:w-44">
            <label htmlFor="order-status-filter" className="sr-only">
              Filter orders by status
            </label>
            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={FIELD}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-64">
            <label htmlFor="order-search" className="sr-only">
              Search orders by order number, status or name
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary"
                aria-hidden="true"
              />
              <input
                id="order-search"
                type="text"
                placeholder="Search orders..."
                className={`${FIELD} pl-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <OrderListSkeleton />
      ) : error ? (
        <div
          role="alert"
          className="rounded-card border-2 border-accent bg-card p-16 text-center"
        >
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-accent" aria-hidden="true" />
          <h2 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
            Couldn't load your orders
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-tertiary">{error}</p>
          <p className="mx-auto mt-2 max-w-sm text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
            Any order you've placed is safe — this is only a problem loading the list.
          </p>
          <button type="button" onClick={fetchOrders} className={`mt-6 ${BTN_INLINE_ACCENT}`}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order, idx) => {
            const payment = getPaymentState(order);
            const PaymentIcon = payment.icon;
            return (
              <motion.div
                key={order.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1], delay: idx * 0.04 }}
              >
                <Link
                  to={`/dashboard/orders/${order.id}`}
                  className={`block rounded-card border-2 bg-card p-4 transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none sm:p-5 ${
                    payment.urgent ? "border-accent" : "border-inverse"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-tag border-2 ${
                          payment.urgent ? "border-accent bg-card" : "border-inverse bg-secondary"
                        }`}
                      >
                        <Package
                          className={`h-5 w-5 ${payment.urgent ? "text-accent" : "text-tertiary"}`}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-xl font-semibold uppercase leading-none tabular-nums text-primary">
                          Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-tertiary">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric", month: "short", day: "numeric"
                            })}
                          </span>
                          <span className={`${CHIP} ${getStatusColor(order.orderStatus)}`}>
                            {order.orderStatus}
                          </span>
                          <span className={`${CHIP} ${payment.className} inline-flex items-center gap-1`}>
                            <PaymentIcon className="h-3 w-3" aria-hidden="true" />
                            {payment.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-3">
                      <div className="hidden text-right sm:block">
                        <p className="font-display text-xl font-semibold leading-none tabular-nums text-primary">
                          Rs {order.totalPrice?.toLocaleString()}
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-tertiary">
                          {order.OrderItems?.length || "—"} items
                        </p>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 ${payment.urgent ? "text-accent" : "text-tertiary"}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {/* A rejected payment is the one state the customer must act on —
                      point them at the order detail, where the re-upload form lives. */}
                  {payment.urgent && (
                    <div className="mt-3 flex items-center gap-2 border-t border-border-primary pt-3">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-accent" aria-hidden="true" />
                      <p className="text-xs font-bold text-accent">
                        Action needed — your payment proof was rejected.{" "}
                        <span className="underline">Upload a new one</span>
                      </p>
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-card border-2 border-inverse bg-card p-16 text-center">
          <Inbox className="mx-auto mb-4 h-12 w-12 text-tertiary" aria-hidden="true" />
          <h2 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
            {hasFilters ? "No orders found" : "No orders yet"}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-tertiary">
            {hasFilters
              ? "No orders match your search or filter. Try a different keyword or status."
              : "You haven't placed any orders yet. Start shopping to see your orders here."}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className={`mt-6 ${BTN_INLINE_SECONDARY}`}
            >
              Clear filters
            </button>
          ) : (
            <Link to="/shop" className={`mt-6 ${BTN_INLINE_ACCENT}`}>
              Browse Products
            </Link>
          )}
        </div>
      )}

      {/* WhatsApp Support */}
      {!error && orders.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-card border-2 border-inverse bg-marigold-soft p-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-accent" aria-hidden="true" />
            <p className="text-sm font-bold text-primary">
              Need help with an order?
            </p>
          </div>
          <a
            href={whatsappUrl("Hi! I need help with my order.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] flex-shrink-0 items-center rounded-tag border-2 border-inverse bg-accent px-4 font-display text-base uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            WhatsApp Us
          </a>
        </div>
      )}
    </div>
  );
};

export default Orders;
