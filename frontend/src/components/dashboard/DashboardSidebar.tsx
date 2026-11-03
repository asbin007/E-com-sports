import type { ComponentType } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, Settings, LogOut, LayoutDashboard, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { whatsappUrl } from "../../data/store";

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
// eslint-disable-next-line react-refresh/only-export-components
export const getActiveNavKey = (pathname: string): string => {
  const normalized = pathname.replace(/\/+$/, "") || "/dashboard";
  const match = [...menuItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => normalized === item.path || normalized.startsWith(`${item.path}/`));
  return match?.key ?? "";
};

const whatsappHref = whatsappUrl("Hi! I need help with my order.");

/** Nav entry: 44px minimum hit area, ink fill when active. */
const NAV_ITEM_BASE =
  "flex min-h-[44px] items-center rounded-tag transition-all duration-snap ease-snap";
const NAV_ITEM_ACTIVE = "border-2 border-inverse bg-accent text-inverse";
const NAV_ITEM_IDLE =
  "border-2 border-transparent text-primary hover:border-inverse hover:bg-surface-hover";

export const DashboardProfileCard = () => {
  const { user } = useAuth();

  return (
    <div className="rounded-card border-2 border-inverse bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-tag border-2 border-inverse bg-accent font-display text-xl font-bold leading-none text-inverse">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-semibold uppercase leading-none text-primary">
            {user?.username}
          </h2>
          <p className="truncate text-xs text-tertiary">{user?.email}</p>
        </div>
      </div>
    </div>
  );
};

export const DashboardHelpCard = () => (
  <div className="rounded-card border-2 border-inverse bg-marigold-soft p-5">
    <h2 className="mb-1 font-display text-xl font-semibold uppercase leading-none text-primary">
      Need Help?
    </h2>
    <p className="mb-4 text-xs text-primary">
      Message us on WhatsApp for order support — Bardibas (Chaudhary Market).
    </p>
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[44px] items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-accent hover:underline"
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
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
      className="scrollbar-hide overflow-x-auto rounded-card border-2 border-inverse bg-card p-1.5"
    >
      <div className="flex w-max min-w-full items-center gap-1">
        {menuItems.map((item) => {
          const isActive = item.key === activeKey;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                NAV_ITEM_BASE,
                "gap-2 whitespace-nowrap px-4",
                isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-inverse" : "text-tertiary")} />
              <span className="font-display text-lg font-semibold uppercase leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        <span aria-hidden="true" className="mx-1 w-px self-stretch bg-border-primary" />

        <button
          onClick={handleLogout}
          className={cn(
            NAV_ITEM_BASE,
            "gap-2 whitespace-nowrap px-4 border-2 border-transparent text-accent hover:border-accent"
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="font-display text-lg font-semibold uppercase leading-none">Logout</span>
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
    <div className="flex w-full flex-col gap-4 lg:sticky lg:top-28 lg:w-72">
      <DashboardProfileCard />

      {/* Navigation */}
      <nav
        aria-label="Dashboard"
        className="space-y-1 rounded-card border-2 border-inverse bg-card p-3"
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
                NAV_ITEM_BASE,
                "gap-3 px-4",
                isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-inverse" : "text-tertiary")} />
              <span className="font-display text-lg font-semibold uppercase leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        <hr className="my-2 border-border-primary" />

        <button
          onClick={handleLogout}
          className={cn(
            NAV_ITEM_BASE,
            "w-full gap-3 px-4 border-2 border-transparent text-accent hover:border-accent"
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="font-display text-lg font-semibold uppercase leading-none">Logout</span>
        </button>
      </nav>

      <DashboardHelpCard />
    </div>
  );
};

export default DashboardSidebar;
