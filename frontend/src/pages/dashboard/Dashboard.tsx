import { useEffect, useState } from "react";
import { Package, ArrowRight, Zap, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { orderService } from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const orders = await orderService.getMyOrders();
        setRecentOrders(orders.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch recent orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const stats = [
    {
      label: "Total Gear Drops",
      value: recentOrders.length,
      icon: Package,
      color: "orange",
    },
    {
      label: "Active Deployments",
      value: recentOrders.filter(
        (o) => o.status !== "delivered" && o.status !== "cancelled",
      ).length,
      icon: Zap,
      color: "stone",
    },
    {
      label: "Loyalty Tier",
      value: "Elite",
      icon: CheckCircle2,
      color: "green",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <div className="space-y-4">
        <h1 className="text-5xl font-black text-stone-950 uppercase italic tracking-tighter leading-none">
          Command <span className="text-orange-600">Center</span>
        </h1>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] max-w-lg">
          Welcome back, <span className="text-stone-950">{user?.username}</span>
          . Your logistics and gear management protocols are active.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-6">
              <div
                className={`w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-orange-600`}
              >
                <stat.icon
                  className={`w-6 h-6 text-gray-400 group-hover:text-white`}
                />
              </div>
              <span className="text-3xl font-black text-stone-950 italic tracking-tighter">
                {stat.value}
              </span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-stone-950 uppercase italic tracking-tight">
            Recent Deployments
          </h2>
          <Link
            to="/dashboard/orders"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 transition-all"
          >
            Full History <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {loading ? (
            [1, 2].map((i) => (
              <div
                key={i}
                className="h-24 bg-white/50 animate-pulse rounded-2xl"
              />
            ))
          ) : recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-orange-600/20 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-stone-950 text-white rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <Package className="w-6 h-6 relative z-10" />
                    <div className="absolute inset-0 bg-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Order #{order.id.slice(-6)}
                    </p>
                    <h4 className="text-sm font-black text-stone-950 uppercase italic tracking-tight flex items-center gap-2">
                      Status:{" "}
                      <span className="text-orange-600">
                        {order.status.toUpperCase()}
                      </span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Inventory Value
                    </p>
                    <p className="text-sm font-black text-stone-950 italic tracking-tight">
                      Rs {order.totalAmount?.toLocaleString()}
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/orders/${order.id}`}
                    className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-stone-950 group-hover:text-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto opacity-50">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                No Recent Gear Deployments Detected
              </p>
              <Link
                to="/shop"
                className="inline-block bg-stone-950 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all italic"
              >
                Initiate First Drop
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

export default Dashboard;
