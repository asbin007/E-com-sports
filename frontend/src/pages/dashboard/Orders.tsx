import { useEffect, useState } from "react";
import {
  Package,
  Search,
  Filter,
  ExternalLink,
  Inbox,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { orderService } from "../../services/orderService";
import { motion, AnimatePresence } from "framer-motion";

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.getMyOrders();
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch order history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-600";
      case "processing":
        return "bg-orange-100 text-orange-600";
      case "shipped":
        return "bg-blue-100 text-blue-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-stone-100 text-stone-600";
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-stone-950 uppercase italic tracking-tighter leading-none">
            Deployment <span className="text-orange-600">History</span>
          </h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
            Track every elite gear mission ever initiated.
          </p>
        </div>

        {/* Search/Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Find Deployment..."
              className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-600/10 transition-all w-64"
            />
          </div>
          <button className="p-3 bg-white border border-gray-100 rounded-xl text-stone-950 hover:bg-stone-950 hover:text-white transition-all">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white/50 animate-pulse rounded-[2.5rem]"
            />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-600/20 transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-gray-50 rounded-full translate-x-1/2 -translate-y-1/2 transition-all group-hover:scale-110" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-20 bg-stone-950 text-white rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0">
                      <Package className="w-8 h-8 relative z-10" />
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Protocol Reference
                        </span>
                        <span className="bg-stone-100 text-stone-950 px-3 py-1 rounded-full text-[9px] font-black">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-stone-950 uppercase italic tracking-tighter leading-tight">
                        Deployment Initiated:{" "}
                        <span className="text-orange-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                        <div className="flex -space-x-2">
                          {order.OrderItems?.slice(0, 3).map((item: any) => {
                            const product = item.Variant?.Product;
                            const imageUrl = product?.images?.[0]
                              ? product.images[0].startsWith("http")
                                ? product.images[0]
                                : `https://res.cloudinary.com/dxpe7jikz/image/upload/v1/${product.images[0].replace("/uploads/", "")}`
                              : "/placeholder-product.png";
                            return (
                              <div
                                key={item.id}
                                className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm"
                              >
                                <img
                                  src={imageUrl}
                                  alt={product?.name || "Product"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            );
                          })}
                          {order.OrderItems?.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-950 text-white flex items-center justify-center text-[8px] font-black">
                              +{order.OrderItems.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-8 lg:gap-16">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Payload Value
                      </p>
                      <p className="text-2xl font-black text-stone-950 italic tracking-tighter">
                        Rs {order.totalAmount?.toLocaleString()}
                      </p>
                    </div>
                    <Link
                      to={`/dashboard/orders/${order.id}`}
                      className="flex items-center gap-3 bg-stone-950 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-xl shadow-stone-950/10 italic"
                    >
                      Track Mission <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white p-24 rounded-[3rem] border border-gray-100 text-center space-y-8">
          <div className="w-32 h-32 bg-stone-50 rounded-[2.5rem] flex items-center justify-center mx-auto relative group-hover:rotate-12 transition-transform">
            <Inbox className="w-16 h-16 text-gray-300" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-stone-950 uppercase italic tracking-tighter">
              No Past Deployments
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-loose">
              The mission log is currently empty. Begin your legacy by
              commissioning gear from the shop.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 bg-stone-950 text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 italic"
          >
            Go To HQ Store <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Orders;
