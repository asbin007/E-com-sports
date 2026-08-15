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
import { orderService } from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  // Full order list is kept in state — the stat tiles count all of them and we
  // slice only at render time for the "Recent Orders" list.
  const [orders, setOrders] = useState<any[]>([]);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "processing": case "preparation": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "shipped": case "ontheway": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "cancelled": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-secondary text-secondary border-border-primary";
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

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          Welcome back, <span className="text-accent">{user?.username}</span>
        </h1>
        <p className="text-sm text-tertiary mt-1">
          Here's an overview of your account activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border-primary">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <span className="text-2xl font-black text-primary">{statValue(totalOrders)}</span>
          </div>
          <p className="text-xs text-muted mt-3 font-medium">Total Orders</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border-primary">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-2xl font-black text-primary">{statValue(activeOrders)}</span>
          </div>
          <p className="text-xs text-muted mt-3 font-medium">Active Orders</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border-primary">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-2xl font-black text-primary">
              {statValue(deliveredOrders)}
            </span>
          </div>
          <p className="text-xs text-muted mt-3 font-medium">Delivered</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">Recent Orders</h2>
          <Link
            to="/dashboard/orders"
            className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="bg-card p-10 rounded-xl border border-red-500/20 text-center"
          >
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-primary">Couldn't load your orders</p>
            <p className="text-xs text-tertiary mt-1 max-w-sm mx-auto">{error}</p>
            <p className="text-xs text-muted mt-2">
              This doesn't affect any order you've placed.
            </p>
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between p-4 bg-card rounded-xl border border-border-primary hover:border-accent/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                    <Package className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                  <span className="text-sm font-bold text-primary hidden sm:block">
                    Rs {order.totalPrice?.toLocaleString()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card p-12 rounded-xl border border-border-primary text-center">
            <ShoppingBag className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-primary">No orders yet</p>
            <p className="text-xs text-muted mt-1">Your order history will appear here.</p>
            <Link
              to="/shop"
              className="inline-block mt-4 px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent-hover transition-all"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
