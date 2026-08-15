import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "../cart/CartDrawer";
import BackToTop from "../ui/BackToTop";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <Navbar />
      <CartDrawer />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />

      {/* Back to Top */}
      <BackToTop />

      {/* WhatsApp Floating Button */}
      <motion.a
        href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "9779748477628"}?text=Hello%20Brothers%20Sports%20House!%20I%20have%20a%20query.`}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-xl shadow-[#25D366]/30 hover:scale-110 transition-all flex items-center justify-center group"
        aria-label="Contact us on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-3 bg-card text-primary text-[11px] font-semibold px-3 py-2 rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all whitespace-nowrap border border-border-primary">
          Chat with us
        </span>
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
      </motion.a>
    </div>
  );
};

export default Layout;
