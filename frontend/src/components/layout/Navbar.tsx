import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Search, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        isScrolled
          ? "bg-stone-950/90 backdrop-blur-md shadow-lg border-white/5"
          : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-orange-500/30 transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-black text-xl italic">B</span>
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase italic">
              Brothers Shoe
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              "Football",
              "Cricket",
              "Basketball",
              "Running",
              "Gym & Fitness",
              "Outdoor",
              "Accessories",
            ].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                className="text-gray-300 font-bold hover:text-white transition-colors relative group text-xs uppercase tracking-widest"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button className="hidden sm:flex text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-orange-600 text-white text-[10px] font-black flex items-center justify-center rounded-full italic">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <Link 
                    to="/dashboard/profile"
                    className="text-[10px] font-black text-white uppercase tracking-wider hidden lg:block hover:text-orange-500 transition-colors cursor-pointer"
                    title="Profile Settings"
                  >
                    {user?.username}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-white text-stone-950 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(234,88,12,0.3)] active:scale-95"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-stone-950 border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-8 space-y-6">
              {[
                "Football",
                "Cricket",
                "Basketball",
                "Running",
                "Gym & Fitness",
                "Outdoor",
                "Accessories",
              ].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                  className="block text-xl font-black text-white py-2 uppercase tracking-tighter italic"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <hr className="border-white/5" />
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center justify-center gap-2 w-full bg-stone-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-stone-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full bg-red-600/10 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600/20"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  Login / Register
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
