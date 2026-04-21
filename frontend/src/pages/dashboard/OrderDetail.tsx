import { useEffect, useState } from "react";
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
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { orderService } from "../../services/orderService";
import { motion } from "framer-motion";
import { getImageUrl } from "../../utils/imageUrl";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading)
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 w-1/3 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-100 rounded-3xl" />
          <div className="h-64 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="text-center py-24 space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <Package className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black uppercase text-stone-950 italic">
          Mission File Lost
        </h2>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Unable to retrieve deployment data for ID: {id}
        </p>
        <button
          onClick={() => navigate("/dashboard/orders")}
          className="bg-stone-950 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest italic"
        >
          Return to History
        </button>
      </div>
    );

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-12">
        <div className="space-y-4">
          <button
            onClick={() => navigate("/dashboard/orders")}
            className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-stone-950 transition-colors group mb-6"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Deployment History
          </button>
          <h1 className="text-5xl font-black text-stone-950 uppercase italic tracking-tighter leading-none">
            Mission{" "}
            <span className="text-orange-600">
              ID #{order.id.slice(-8).toUpperCase()}
            </span>
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest italic">
                Protocol Verified
              </span>
            </div>
          </div>
        </div>

        <div className="bg-stone-950 text-white px-8 py-4 rounded-2xl flex items-center gap-6 shadow-xl shadow-stone-950/10">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
              Deployment Status
            </p>
            <p className="text-xl font-black uppercase italic tracking-tighter text-orange-600">
              {order.status}
            </p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <Truck className="w-8 h-8 text-gray-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Side: Items & Logistics */}
        <div className="lg:col-span-8 space-y-12">
          {/* Deployment Timeline */}
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Truck className="w-32 h-32 text-stone-950" />
            </div>
            <h3 className="text-xl font-black text-stone-950 uppercase italic tracking-tight mb-10 flex items-center gap-3">
              <Zap className="w-5 h-5 text-orange-600" /> Deployment Logistics
            </h3>

            <div className="space-y-12 relative">
              <div className="absolute left-6 top-8 bottom-8 w-px bg-stone-100" />

              <div className="flex gap-8 relative z-10">
                <div className="w-12 h-12 bg-white border border-stone-100 rounded-2xl shadow-sm text-stone-950 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="py-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-950 italic">
                    Mission Conceived
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Deployment order has been validated and accepted by HQ
                  </p>
                </div>
              </div>

              <div className="flex gap-8 relative z-10 opacity-30">
                <div className="w-12 h-12 bg-gray-50 border border-stone-100 rounded-2xl text-gray-400 flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="py-1">
                  <h4 className="text-xs font-black uppercase tracking-widest italic">
                    Neutral Ground Transit
                  </h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1">
                    Gear is currently in transit to your deployment zone
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Listing */}
          <div className="space-y-8">
            <h3 className="text-xl font-black text-stone-950 uppercase italic tracking-tight flex items-center gap-3">
              <Package className="w-5 h-5 text-orange-600" /> Payload Items
            </h3>

            <div className="space-y-4">
              {order.OrderItems?.map((item: any) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 10 }}
                  className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-24 bg-stone-50 rounded-2xl overflow-hidden border border-gray-50 p-2 relative">
                      <img
                        src={(() => {
                          const product = item.Variant?.Product;
                          const firstImage = product?.images?.[0];
                          if (!firstImage) return "/placeholder-product.png";
                          return (
                            getImageUrl(firstImage as any) ??
                            "/placeholder-product.png"
                          );
                        })()}
                        alt={item.Variant?.Product?.name || "Product"}
                        className="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-110"
                      />
                      <div className="absolute top-2 right-2 bg-stone-950 text-white w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center italic">
                        {item.quantity}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest italic mb-1">
                        {item.Variant?.Product?.Brand?.name}
                      </p>
                      <h4 className="text-sm font-black text-stone-950 uppercase italic tracking-tight mb-2">
                        {item.productName || item.Variant?.Product?.name}
                      </h4>
                      <div className="flex items-center gap-4">
                        <span className="bg-gray-100 text-stone-950 px-3 py-1 rounded-full text-[8px] font-black uppercase">
                          Size: {item.size || item.Variant?.size}
                        </span>
                        <span className="bg-gray-100 text-stone-950 px-3 py-1 rounded-full text-[8px] font-black uppercase">
                          Color: {item.color || item.Variant?.color}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic text-right">
                      Unit Impact
                    </p>
                    <p className="text-lg font-black text-stone-950 italic">
                      Rs {item.price?.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Financials & Mission Files */}
        <div className="lg:col-span-4 space-y-8">
          {/* Hub Details */}
          <div className="bg-stone-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 blur-[100px] rounded-full" />

            <div className="relative z-10 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest italic">
                    Deployment Hub
                  </h4>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-3">
                  <p className="text-[10px] font-bold text-gray-300 uppercase italic tracking-widest">
                    Target Location
                  </p>
                  <p className="text-sm font-black italic text-white uppercase leading-relaxed">
                    {order.firstName} {order.lastName}
                    <br />
                    {order.addressLine}, {order.city}
                    <br />
                    {order.state} - {order.zipcode}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest italic">
                    Financial Protocol
                  </h4>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400 italic">Method</span>
                    <span className="text-white bg-orange-600 px-3 py-1 rounded-md">
                      {order.paymentMethod}
                    </span>
                  </div>
                  <div className="w-full h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                      Financial Payload
                    </span>
                    <span className="text-2xl font-black italic tracking-tighter">
                      Rs {order.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-3 opacity-40">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <p className="text-[8px] font-black uppercase tracking-widest">
                  Verified Authentication Sequence
                </p>
              </div>
            </div>
          </div>

          {/* Support Actions */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
            <button className="w-full bg-gray-50 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-950 hover:text-white transition-all italic flex items-center justify-center gap-2">
              Download Protocol Receipt <ArrowUpRight className="w-4 h-4" />
            </button>
            <a 
              href={`https://wa.me/1234567890?text=${encodeURIComponent(`Hello, I need help with my Order/Mission #${order.id.slice(-8).toUpperCase()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366]/10 text-[#25D366] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all italic flex items-center justify-center gap-2"
            >
              Contact Support via WhatsApp
            </a>
            <button className="w-full bg-red-50 text-red-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all italic">
              Request Mission Abortion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
