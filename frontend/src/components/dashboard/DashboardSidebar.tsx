import { Link, useLocation } from "react-router-dom";
import {
  Package,
  Settings,
  LogOut,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

const DashboardSidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    {
      label: "Overview",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Orders",
      path: "/dashboard/orders",
      icon: Package,
    },
    {
      label: "Profile Settings",
      path: "/dashboard/profile",
      icon: Settings,
    },
  ];

  return (
    <div className="w-full lg:w-80 flex flex-col gap-8">
      {/* Profile Summary */}
      <div className="bg-stone-950 text-white rounded-[2.5rem] p-8 relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 transition-all group-hover:bg-orange-600/20" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-2xl font-black italic shadow-2xl shadow-orange-600/20">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic mb-1">
              Authenticated Hero
            </p>
            <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">
              {user?.username}
            </h3>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl transition-all group",
                isActive
                  ? "bg-stone-950 text-white shadow-xl shadow-stone-950/10"
                  : "hover:bg-gray-50 text-gray-500 hover:text-stone-950",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    isActive
                      ? "bg-orange-600"
                      : "bg-gray-100 group-hover:bg-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-stone-950",
                    )}
                  />
                </div>
                <span className="font-black text-xs uppercase tracking-widest italic">
                  {item.label}
                </span>
              </div>
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform",
                  isActive ? "opacity-100 translate-x-1" : "opacity-0",
                )}
              />
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-gray-50">
          <button
            onClick={logout}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all group"
          >
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-black text-xs uppercase tracking-widest italic">
              Terminate Session
            </span>
          </button>
        </div>
      </div>

      {/* Help Banner */}
      <div className="bg-orange-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full" />
        <h4 className="text-sm font-black uppercase italic tracking-tight mb-2 relative z-10">
          Need Support?
        </h4>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 leading-relaxed relative z-10">
          24/7 Elite assistance for your gear deployments.
        </p>
        <button className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] bg-stone-950 px-6 py-3 rounded-full hover:bg-white hover:text-orange-600 transition-all active:scale-95 italic relative z-10">
          Contact High Command
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
