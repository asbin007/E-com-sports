import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Heart,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-inverse text-inverse relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Main Footer Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                <span className="text-white font-black text-lg italic">B</span>
              </div>
              <div>
                <span className="text-lg font-black text-inverse tracking-tight uppercase italic leading-none block">
                  Brothers
                </span>
                <span className="text-[8px] font-bold text-accent uppercase tracking-[0.25em] leading-none">
                  Sports House
                </span>
              </div>
            </div>
            <p className="text-inverse/50 text-sm leading-relaxed">
              Your one-stop destination for premium sports gear, equipment, and
              accessories. Serving athletes across Nepal with quality and trust.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {[
                {
                  icon: MessageCircle,
                  label: "WhatsApp",
                  hoverColor: "hover:bg-[#25D366] hover:border-[#25D366]",
                  href: `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "9779748477628"}`,
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 bg-primary/5 border border-border-primary/20 rounded-xl flex items-center justify-center ${social.hoverColor} transition-all hover:scale-110 hover:shadow-lg`}
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-inverse font-bold text-sm uppercase tracking-wider mb-6">
              Shop by Sport
            </h4>
            <ul className="space-y-3.5">
              {["Football", "Cricket", "Basketball", "Running", "Gym & Fitness", "Outdoor"].map(
                (item) => (
                  <li key={item}>
                    <Link
                      to={`/${item.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                      className="text-inverse/50 text-sm hover:text-accent transition-colors flex items-center gap-3 group"
                    >
                      <span className="w-1.5 h-1.5 bg-primary/20 rounded-full group-hover:bg-accent group-hover:scale-125 transition-all" />
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-inverse font-bold text-sm uppercase tracking-wider mb-6">
              Customer Support
            </h4>
            <ul className="space-y-3.5">
              {[{ label: "Order Tracking", to: "/dashboard/orders" }].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-inverse/50 text-sm hover:text-accent transition-colors flex items-center gap-3 group"
                  >
                    <span className="w-1.5 h-1.5 bg-primary/20 rounded-full group-hover:bg-accent group-hover:scale-125 transition-all" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-inverse font-bold text-sm uppercase tracking-wider mb-6">
              Get in Touch
            </h4>
            <div className="space-y-5">
              {[
                { icon: Mail, text: "support@brotherssportshouse.com", href: "mailto:support@brotherssportshouse.com" },
                { icon: Phone, text: "+977 9800000000", href: "tel:+9779800000000" },
                { icon: MapPin, text: "Kathmandu, Nepal", href: null },
              ].map((contact) => (
                <div key={contact.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                    <contact.icon className="w-4 h-4 text-accent" />
                  </div>
                  {contact.href ? (
                    <a
                      href={contact.href}
                      className="text-inverse/50 text-sm hover:text-accent transition-colors"
                    >
                      {contact.text}
                    </a>
                  ) : (
                    <span className="text-inverse/50 text-sm">{contact.text}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="mt-8">
              <p className="text-[10px] font-bold text-inverse/30 uppercase tracking-wider mb-3">
                We Accept
              </p>
              <div className="flex gap-2">
                {["eSewa QR", "Cash on Delivery"].map((method) => (
                  <span
                    key={method}
                    className="px-3 py-2 bg-primary/5 border border-border-primary/20 rounded-lg text-[10px] font-bold text-inverse/60"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border-primary/20 relative z-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-inverse/40 text-xs flex items-center gap-1">
            &copy; {new Date().getFullYear()} Brothers Sports House. Made with{" "}
            <Heart className="w-3 h-3 text-accent fill-accent inline" /> in Nepal.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
