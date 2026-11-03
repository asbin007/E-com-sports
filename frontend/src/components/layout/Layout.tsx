import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "../cart/CartDrawer";
import BackToTop from "../ui/BackToTop";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { whatsappUrl } from "../../data/store";

/** cubic-bezier(.2,.7,.3,1) — the one easing in the system. */
const EASE_SNAP: [number, number, number, number] = [0.2, 0.7, 0.3, 1];

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-primary">
      <Navbar />
      <CartDrawer />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />

      {/* Back to Top */}
      <BackToTop />

      {/* WhatsApp button — pitch ground, flat, 56px so it clears the 44px floor */}
      <motion.a
        href={whatsappUrl("Hello Brothers Sports House! I have a query.")}
        target="_blank"
        rel="noopener noreferrer"
        // Opacity only: animating `y` leaves framer's inline transform on the
        // element and the Tailwind hover lift below could never apply.
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16, ease: EASE_SNAP, delay: 0.3 }}
        className="group fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-tag border-2 border-inverse bg-pitch text-inverse transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
        aria-label="Order on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-tag border-2 border-inverse bg-card px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary opacity-0 transition duration-snap ease-snap group-hover:opacity-100">
          Order on WhatsApp
        </span>
      </motion.a>
    </div>
  );
};

export default Layout;
