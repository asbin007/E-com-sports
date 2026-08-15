import type { ComponentType } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, Settings, LogOut, LayoutDashboard, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

type NavItem = {
  /** Stable identity for this nav entry — the active check keys off this, never off raw path equality. */
  key: string;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
};

const menuItems: NavItem[] = [
  { key: "overview", label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { key: "orders", label: "My Orders", path: "/dashboard/orders", icon: Package },
  { key: "profile", label: "Profile", path: "/dashboard/profile", icon: Settings },
];

/**
 * Resolves the single active nav key for a pathname.
 * Longest matching path wins, so exactly one item can ever be active — two items
 * sharing a path (the old Wishlist/Overview bug) can no longer both light up, and
 * nested routes like /dashboard/orders/:id correctly keep "My Orders" highlighted.
 */
export const getActiveNavKey = (pathname: string): string => {
  const normalized = pathname.replace(/\/+$/, "") || "/dashboard";
  const match = [...menuItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => normalized === item.path || normalized.startsWith(`${item.path}/`));
  return match?.key ?? "";
};

const whatsappHref = `https://wa.me/${
  import.meta.env.VITE_WHATSAPP_NUMBER || "9779748477628"
}?text=Hi!%20I%20need%20help%20with%20my%20order.`;

export const DashboardProfileCard = () => {
  const { user } = useAuth();

  return (
    <div className="bg-card rounded-2xl p-5 border border-border-primary">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white text-lg font-bold">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-primary truncate">{user?.username}</h3>
          <p className="text-xs text-muted truncate">{user?.email}</p>
        </div>
      </div>
    </div>
  );
};

export const DashboardHelpCard = () => (
  <div className="bg-accent/10 rounded-2xl p-5 border border-accent/20">
    <h4 className="text-sm font-bold text-primary mb-1">Need Help?</h4>
    <p className="text-xs text-tertiary mb-4">
      Contact us anytime via WhatsApp for order support.
    </p>
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs font-bold text-accent hover:underline"
    >
      <MessageCircle className="w-4 h-4" />
      Chat on WhatsApp
    </a>
  </div>
);

/**
 * Horizontally scrollable tab strip used below `lg`, so the content the customer
 * came for is the first thing on screen instead of a full-height nav column.
 */
export const DashboardNavTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const activeKey = getActiveNavKey(location.pathname);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav
      aria-label="Dashboard"
      className="bg-card rounded-2xl border border-border-primary p-1.5 overflow-x-auto scrollbar-hide"
    >
      <div className="flex items-center gap-1 w-max min-w-full">
        {menuItems.map((item) => {
          const isActive = item.key === activeKey;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap",
                isActive
                  ? "bg-accent text-white"
                  : "text-secondary hover:bg-surface-hover hover:text-primary"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-muted")} />
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          );
        })}

        <span aria-hidden="true" className="w-px self-stretch bg-secondary mx-1" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-500/5 transition-all whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </nav>
  );
};

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const activeKey = getActiveNavKey(location.pathname);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="w-full lg:w-72 flex flex-col gap-4 lg:sticky lg:top-28">
      <DashboardProfileCard />

      {/* Navigation */}
      <nav
        aria-label="Dashboard"
        className="bg-card rounded-2xl p-3 border border-border-primary space-y-1"
      >
        {menuItems.map((item) => {
          const isActive = item.key === activeKey;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive
                  ? "bg-accent text-white"
                  : "text-secondary hover:bg-surface-hover hover:text-primary"
              )}
            >
              <Icon className={cn("w-4.5 h-4.5", isActive ? "text-white" : "text-muted")} />
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          );
        })}

        <hr className="border-border-primary my-2" />

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </nav>

      <DashboardHelpCard />
    </div>
  );
};

export default DashboardSidebar;
