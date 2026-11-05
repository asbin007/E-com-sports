import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Search,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";

/** cubic-bezier(.2,.7,.3,1) — the one easing in the system. */
const EASE_SNAP: [number, number, number, number] = [0.2, 0.7, 0.3, 1];

/** 44x44 minimum hit area on every icon-only control (WCAG 2.5.5). */
const ICON_BUTTON =
  "inline-flex h-11 w-11 items-center justify-center rounded-tag text-secondary transition duration-snap ease-snap hover:bg-surface-hover hover:text-primary";

const navLinks = [
  { name: "Shop", path: "/shop" },
  { name: "Boots", path: "/football-boots" },
  { name: "Jerseys", path: "/club-jerseys" },
  { name: "Team Kits", path: "/team-kits" },
  { name: "Footballs", path: "/footballs" },
  { name: "Trophies", path: "/trophies-medals" },
];

/** Links that only appear in the mobile sheet. */
const mobileExtraLinks = [
  { name: "Training Wear", path: "/training-wear" },
  { name: "Bags", path: "/bags" },
  { name: "Accessories", path: "/accessories" },
];

/** What the shop actually says, in the order it says it. */
const announcements = [
  "COD available",
  "Delivery all over Nepal",
  "Bardibas · Chaudhary Market",
];

const popularSearches = [
  "Club jerseys",
  "Football size 5",
  "Boots UK 8",
  "Team kit set",
  "Trophies",
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Announcement rule — the shop's own three facts, no emoji, no pulse */}
      <div className="band relative z-50 py-2">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 text-[11px] font-bold uppercase tracking-[0.12em]">
          {announcements.map((line, idx) => (
            <span key={line} className="flex items-center gap-3">
              {idx > 0 && <span aria-hidden="true" className="h-3 w-px bg-primary/30" />}
              {line}
            </span>
          ))}
        </div>
      </div>

      {/* Main Navigation */}
      <nav
        className={cn(
          "sticky top-0 z-50 bg-primary transition duration-snap ease-snap",
          isScrolled ? "border-b-[3px] border-inverse" : "border-b-2 border-border-primary"
        )}
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-[72px]">
            {/* Logo — a shirt number on a tag, never italic */}
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-tag border-2 border-inverse bg-accent font-display text-2xl font-bold leading-none text-white">
                B
              </span>
              <span className="hidden sm:block">
                <span className="block font-display text-xl font-bold uppercase leading-none text-primary">
                  Brothers
                </span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                  Sports House
                </span>
              </span>
            </Link>

            {/* Center Nav Links */}
            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "relative inline-flex h-11 items-center rounded-tag px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition duration-snap ease-snap",
                      isActive
                        ? "text-accent"
                        : "text-secondary hover:bg-surface-hover hover:text-primary"
                    )}
                  >
                    {link.name}
                    {isActive && (
                      <motion.span
                        layoutId="activeNav"
                        className="absolute bottom-1.5 left-1/2 h-[3px] w-6 -translate-x-1/2 bg-accent"
                        transition={{ duration: 0.12, ease: EASE_SNAP }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className={ICON_BUTTON}
                aria-label="Search products"
              >
                <Search className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className={ICON_BUTTON}
                aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              >
                {isDark ? (
                  <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
                ) : (
                  <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className={cn(ICON_BUTTON, "relative")}
                aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              >
                <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute right-1 top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-tag border-[1.5px] border-inverse bg-accent px-1 font-display text-xs font-bold leading-none tabular-nums text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="ml-1 hidden items-center gap-1 sm:flex">
                  <Link
                    to="/dashboard"
                    className="inline-flex h-11 items-center gap-2 rounded-tag px-2 transition duration-snap ease-snap hover:bg-surface-hover"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-tag border-[1.5px] border-inverse bg-marigold-soft font-display text-sm font-bold leading-none text-marigold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden max-w-[80px] truncate text-[11px] font-bold uppercase tracking-[0.12em] text-primary md:block">
                      {user?.username}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className={cn(ICON_BUTTON, "hover:text-accent")}
                    aria-label="Log out"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="ml-2 hidden h-11 items-center gap-1.5 rounded-tag border-2 border-inverse bg-accent px-4 font-display text-base font-semibold uppercase leading-none text-white transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none sm:inline-flex"
                >
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  Login
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className={cn(ICON_BUTTON, "ml-1 text-primary lg:hidden")}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.16, ease: EASE_SNAP }}
              className="overflow-hidden border-t-2 border-inverse bg-primary lg:hidden"
            >
              <div className="space-y-1 px-4 py-6">
                {[...navLinks, ...mobileExtraLinks].map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex min-h-[44px] items-center justify-between rounded-tag px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition duration-snap ease-snap",
                        isActive
                          ? "bg-marigold-soft text-marigold"
                          : "text-secondary hover:bg-surface-hover hover:text-primary"
                      )}
                    >
                      <span>{link.name}</span>
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  );
                })}

                {/* Mobile Auth Section */}
                <div className="mt-4 border-t border-border-primary pt-4">
                  {isAuthenticated ? (
                    <div className="flex items-center justify-between gap-3 px-4">
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex min-h-[44px] items-center gap-3"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-tag border-2 border-inverse bg-marigold-soft font-display text-lg font-bold leading-none text-marigold">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <span className="block font-display text-lg font-semibold uppercase leading-none text-primary">
                            {user?.username}
                          </span>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                            View dashboard
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          navigate("/");
                          setMobileOpen(false);
                        }}
                        className="inline-flex min-h-[44px] items-center rounded-tag border-2 border-inverse bg-card px-4 font-display text-base font-semibold uppercase leading-none text-primary transition duration-snap ease-snap hover:text-accent"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex min-h-[44px] flex-1 items-center justify-center rounded-tag border-2 border-inverse bg-accent font-display text-base font-semibold uppercase leading-none text-white transition duration-snap ease-snap hover:bg-accent-hover"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileOpen(false)}
                        className="flex min-h-[44px] flex-1 items-center justify-center rounded-tag border-2 border-inverse bg-card font-display text-base font-semibold uppercase leading-none text-primary transition duration-snap ease-snap hover:text-accent"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search Overlay — a flat ink scrim, no backdrop blur */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: EASE_SNAP }}
            className="fixed inset-0 z-[200] flex items-start justify-center bg-inverse/80 pt-[15vh]"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.16, ease: EASE_SNAP }}
              className="mx-4 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-tertiary"
                    aria-hidden="true"
                  />
                  <label className="sr-only" htmlFor="navbar-search">
                    Search products
                  </label>
                  <input
                    ref={searchRef}
                    id="navbar-search"
                    type="text"
                    placeholder="Club jersey, boots UK 8, football size 5..."
                    className="w-full rounded-card border-2 border-inverse bg-card py-4 pl-12 pr-14 text-base text-primary outline-none transition duration-snap ease-snap focus:border-accent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-tag text-tertiary transition duration-snap ease-snap hover:bg-surface-hover hover:text-primary"
                    aria-label="Close search"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </form>

              {/* Search Suggestions — real catalogue language */}
              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-inverse">
                  Popular searches
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        navigate(`/shop?q=${encodeURIComponent(term)}`);
                        setSearchOpen(false);
                      }}
                      className="inline-flex min-h-[44px] items-center rounded-tag border-2 border-inverse bg-card px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-primary transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent hover:text-white hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
