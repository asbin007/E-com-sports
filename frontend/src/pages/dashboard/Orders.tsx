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
import { orderService } from "../../services/orderService";
import { motion } from "framer-motion";
import { OrderListSkeleton } from "../../components/ui/Skeleton";

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
      className: "bg-red-500/10 text-red-600 border-red-500/30",
      icon: AlertTriangle,
      urgent: true,
    };
  }
  if (status === "paid") {
    return {
      label: "Payment verified",
      className: "bg-green-500/10 text-green-600 border-green-500/20",
      icon: CheckCircle2,
      urgent: false,
    };
  }
  if (status === "refunded") {
    return {
      label: "Refunded",
      className: "bg-secondary text-secondary border-border-primary",
      icon: RotateCcw,
      urgent: false,
    };
  }
  if (isCod) {
    return {
      label: "Pay on delivery",
      className: "bg-secondary text-secondary border-border-primary",
      icon: Wallet,
      urgent: false,
    };
  }
  return {
    label: "Awaiting verification",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    icon: Clock,
    urgent: false,
  };
};

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "processing": case "preparation": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "shipped": case "ontheway": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "cancelled": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-secondary text-secondary border-border-primary";
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">My Orders</h1>
          <p className="text-sm text-tertiary mt-1">Track and manage your orders</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-44">
            <label htmlFor="order-status-filter" className="sr-only">
              Filter orders by status
            </label>
            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-secondary border border-border-primary rounded-xl text-sm text-primary font-medium focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition-all"
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                id="order-search"
                type="text"
                placeholder="Search orders..."
                className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border-primary rounded-xl text-sm text-primary font-medium focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none transition-all placeholder:text-muted"
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
          className="bg-card p-16 rounded-xl border border-red-500/20 text-center"
        >
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-primary">Couldn't load your orders</h2>
          <p className="text-sm text-tertiary mt-1 max-w-sm mx-auto">{error}</p>
          <p className="text-xs text-muted mt-2 max-w-sm mx-auto">
            Any order you've placed is safe — this is only a problem loading the list.
          </p>
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover transition-all"
          >
            <RefreshCw className="w-4 h-4" />
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/dashboard/orders/${order.id}`}
                  className={`block p-4 sm:p-5 bg-card rounded-xl border transition-all group ${
                    payment.urgent
                      ? "border-red-500/40 hover:border-red-500/60 hover:shadow-sm"
                      : "border-border-primary hover:border-accent/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                          payment.urgent
                            ? "bg-red-500/10"
                            : "bg-secondary group-hover:bg-accent/10"
                        }`}
                      >
                        <Package
                          className={`w-5 h-5 transition-colors ${
                            payment.urgent
                              ? "text-red-500"
                              : "text-muted group-hover:text-accent"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary">
                          Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric", month: "short", day: "numeric"
                            })}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(order.orderStatus)}`}>
                            {order.orderStatus}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${payment.className}`}
                          >
                            <PaymentIcon className="w-3 h-3" />
                            {payment.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-primary">
                          Rs {order.totalPrice?.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted">
                          {order.OrderItems?.length || "—"} items
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 transition-colors ${
                          payment.urgent ? "text-red-500" : "text-muted group-hover:text-accent"
                        }`}
                      />
                    </div>
                  </div>

                  {/* A rejected payment is the one state the customer must act on —
                      point them at the order detail, where the re-upload form lives. */}
                  {payment.urgent && (
                    <div className="mt-3 pt-3 border-t border-red-500/20 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <p className="text-xs font-semibold text-red-600">
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
        <div className="bg-card p-16 rounded-xl border border-border-primary text-center">
          <Inbox className="w-12 h-12 text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-primary">
            {hasFilters ? "No orders found" : "No orders yet"}
          </h2>
          <p className="text-sm text-tertiary mt-1 max-w-sm mx-auto">
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
              className="inline-block mt-6 px-6 py-2.5 bg-secondary text-primary border border-border-primary rounded-xl text-sm font-bold hover:bg-surface-hover transition-all"
            >
              Clear filters
            </button>
          ) : (
            <Link
              to="/shop"
              className="inline-block mt-6 px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover transition-all"
            >
              Browse Products
            </Link>
          )}
        </div>
      )}

      {/* WhatsApp Support */}
      {!error && orders.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-accent" />
            <p className="text-sm text-primary font-medium">
              Need help with an order?
            </p>
          </div>
          <a
            href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "9779748477628"}?text=Hi!%20I%20need%20help%20with%20my%20order.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent-hover transition-all flex-shrink-0"
          >
            WhatsApp Us
          </a>
        </div>
      )}
    </div>
  );
};

export default Orders;
