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

const navLinks = [
  { name: "Shop", path: "/shop" },
  { name: "Football", path: "/football" },
  { name: "Cricket", path: "/cricket" },
  { name: "Basketball", path: "/basketball" },
  { name: "Running", path: "/running" },
  { name: "Gym", path: "/gym-fitness" },
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
      {/* Announcement Bar */}
      <div className="bg-inverse text-inverse text-center py-2 text-[11px] font-medium tracking-wide relative z-50 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <span className="inline-block animate-pulse">🏆</span>
          <span>Fast Delivery All Over Nepal</span>
          <span className="mx-2 text-white/30">|</span>
          <span>7-Day Easy Returns</span>
          <span className="mx-2 text-white/30">|</span>
          <span>100% Authentic Products</span>
        </motion.div>
      </div>

      {/* Main Navigation */}
      <nav
        className={cn(
          "sticky top-0 z-50 transition-all duration-500",
          isScrolled
            ? "glass shadow-lg shadow-black/5 border-b border-border-primary"
            : "bg-primary"
        )}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: -5, scale: 1.05 }}
                className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20"
              >
                <span className="text-white font-black text-base italic">B</span>
              </motion.div>
              <div className="hidden sm:block leading-none">
                <span className="text-sm font-black text-primary block tracking-tight uppercase">
                  Brothers
                </span>
                <span className="text-[8px] font-bold text-accent uppercase tracking-[0.2em]">
                  Sports House
                </span>
              </div>
            </Link>

            {/* Center Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "relative px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-300",
                      isActive
                        ? "text-accent"
                        : "text-secondary hover:text-primary hover:bg-surface-hover"
                    )}
                  >
                    {link.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent rounded-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpen(true)}
                className="p-2.5 text-secondary hover:text-primary rounded-xl hover:bg-surface-hover transition-all"
              >
                <Search className="w-[18px] h-[18px]" />
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                whileTap={{ scale: 0.9, rotate: 180 }}
                onClick={toggleTheme}
                className="p-2.5 text-secondary hover:text-primary rounded-xl hover:bg-surface-hover transition-all"
              >
                {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </motion.button>

              {/* Cart */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCartOpen(true)}
                className="p-2.5 text-secondary hover:text-primary rounded-xl hover:bg-surface-hover transition-all relative"
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm"
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-1 ml-1">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-hover transition-all"
                  >
                    <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
                      <span className="text-[11px] font-bold text-accent">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-primary hidden md:block max-w-[80px] truncate">
                      {user?.username}
                    </span>
                  </Link>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { logout(); navigate("/"); }}
                    className="p-2 text-muted hover:text-red-500 rounded-xl hover:bg-red-500/5 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1.5 ml-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent-hover transition-all active:scale-95 shadow-lg shadow-accent/20"
                >
                  <User className="w-3.5 h-3.5" />
                  Login
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 text-primary rounded-xl hover:bg-surface-hover ml-1"
              >
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
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
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden bg-primary border-t border-border-primary overflow-hidden"
            >
              <div className="px-4 py-6 space-y-2">
                {navLinks.map((link, idx) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                          isActive
                            ? "bg-accent/10 text-accent"
                            : "text-secondary hover:text-primary hover:bg-surface-hover"
                        )}
                      >
                        <span>{link.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-40" />
                      </Link>
                    </motion.div>
                  );
                })}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.05 }}
                >
                  <Link
                    to="/outdoor"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-secondary hover:text-primary hover:bg-surface-hover transition-all"
                  >
                    <span>Outdoor</span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navLinks.length + 1) * 0.05 }}
                >
                  <Link
                    to="/accessories"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-secondary hover:text-primary hover:bg-surface-hover transition-all"
                  >
                    <span>Accessories</span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                </motion.div>

                {/* Mobile Auth Section */}
                <div className="pt-4 mt-4 border-t border-border-primary">
                  {isAuthenticated ? (
                    <div className="flex items-center justify-between px-4">
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                          <span className="text-sm font-bold text-accent">
                            {user?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">{user?.username}</p>
                          <p className="text-[10px] text-muted">View Dashboard</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => { logout(); navigate("/"); setMobileOpen(false); }}
                        className="px-4 py-2 text-sm font-medium text-red-500 bg-red-500/5 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex-1 text-center py-3 bg-accent text-white rounded-xl text-sm font-bold"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileOpen(false)}
                        className="flex-1 text-center py-3 bg-secondary text-primary border border-border-primary rounded-xl text-sm font-bold"
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

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[15vh]"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search for football boots, cricket bats, running shoes..."
                    className="w-full pl-14 pr-14 py-5 bg-card rounded-2xl text-primary text-base font-medium border border-border-primary shadow-2xl focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-primary rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Search Suggestions */}
              <div className="mt-4 px-2">
                <p className="text-xs text-white/40 mb-3 font-medium">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {["Football boots", "Cricket bat", "Running shoes", "Gym gloves", "Jersey"].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        navigate(`/shop?q=${encodeURIComponent(term)}`);
                        setSearchOpen(false);
                      }}
                      className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-lg text-xs font-medium hover:bg-accent hover:text-white transition-all"
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
