import { useCallback, useEffect, useState } from "react";
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  ShoppingBag,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { orderService, type Order } from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";

const CHIP =
  "rounded-tag border-[1.5px] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]";
const BTN_INLINE_ACCENT =
  "inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-accent px-5 font-display text-lg uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none";

const Dashboard = () => {
  const { user } = useAuth();
  // Full order list is kept in state — the stat tiles count all of them and we
  // slice only at render time for the "Recent Orders" list.
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch recent orders:", err);
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
  // sale, cancelled reads accent crimson.
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "text-pitch border-pitch";
      case "processing": case "preparation": return "text-sale border-sale";
      case "shipped": case "ontheway": return "text-sale border-sale";
      case "pending": return "text-sale border-sale";
      case "cancelled": return "text-accent border-accent";
      default: return "text-tertiary border-border-primary";
    }
  };

  const totalOrders = orders.length;
  const activeOrders = orders.filter(
    (o) => o.orderStatus !== "delivered" && o.orderStatus !== "cancelled"
  ).length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered").length;
  const recentOrders = orders.slice(0, 5);

  // Never show a confident "0" for a count we failed to load.
  const statValue = (value: number) => (loading || error ? "—" : value);

  const stats = [
    { label: "Total Orders", value: statValue(totalOrders), icon: Package, tone: "text-accent" },
    { label: "Active Orders", value: statValue(activeOrders), icon: Clock, tone: "text-sale" },
    { label: "Delivered", value: statValue(deliveredOrders), icon: CheckCircle2, tone: "text-pitch" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <p className="eyebrow mb-2">Your account</p>
        <h1 className="font-display text-[34px] font-semibold uppercase leading-none text-primary">
          Welcome back, <span className="text-accent">{user?.username}</span>
        </h1>
        <p className="mt-1 text-sm text-tertiary">
          Here's an overview of your account activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card border-2 border-inverse bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-tag border-2 border-inverse bg-card">
                <stat.icon className={`h-5 w-5 ${stat.tone}`} aria-hidden="true" />
              </div>
              <span className="font-display text-[34px] font-semibold leading-none tabular-nums text-primary">
                {stat.value}
              </span>
            </div>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
            Recent Orders
          </h2>
          <Link
            to="/dashboard/orders"
            className="flex min-h-[44px] items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent transition-colors duration-snap ease-snap hover:text-accent-hover"
          >
            View All <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-card border-2 border-border-primary bg-secondary"
              />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-card border-2 border-accent bg-card p-10 text-center"
          >
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-accent" aria-hidden="true" />
            <h3 className="font-display text-xl font-semibold uppercase leading-none text-primary">
              Couldn't load your orders
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-xs text-tertiary">{error}</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
              This doesn't affect any order you've placed.
            </p>
            <button type="button" onClick={fetchOrders} className={`mt-4 ${BTN_INLINE_ACCENT}`}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/dashboard/orders/${order.id}`}
                className="group flex min-h-[44px] items-center justify-between rounded-card border-2 border-inverse bg-card p-4 transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-tag border-2 border-inverse bg-secondary">
                    <Package className="h-5 w-5 text-tertiary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold uppercase leading-none tabular-nums text-primary">
                      Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-tertiary">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`${CHIP} ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                  <span className="hidden font-display text-xl font-semibold leading-none tabular-nums text-primary sm:block">
                    Rs {order.totalPrice?.toLocaleString()}
                  </span>
                  <ChevronRight className="h-4 w-4 text-tertiary" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-card border-2 border-inverse bg-card p-12 text-center">
            <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-tertiary" aria-hidden="true" />
            <h3 className="font-display text-xl font-semibold uppercase leading-none text-primary">
              No orders yet
            </h3>
            <p className="mt-1 text-xs text-tertiary">Your order history will appear here.</p>
            <Link to="/shop" className={`mt-4 ${BTN_INLINE_ACCENT}`}>
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
