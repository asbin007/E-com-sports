import { Link } from "react-router-dom";
import { Phone, MapPin, MessageCircle, Heart, Facebook } from "lucide-react";
import { STORE, whatsappUrl } from "../../data/store";
import TikTokIcon from "../ui/TikTokIcon";

/** Labels slugify to the seeded category slugs: "Trophies & Medals" → trophies-medals. */
const categories = [
  "Football Boots",
  "Club Jerseys",
  "Team Kits",
  "Footballs",
  "Trophies & Medals",
  "Training Wear",
  "Bags",
];

const COLUMN_HEADING =
  "font-display text-[22px] font-semibold uppercase leading-none text-inverse";

/** 44x44 minimum hit area on the icon-only social links (WCAG 2.5.5). */
const SOCIAL_LINK =
  "inline-flex h-11 w-11 items-center justify-center rounded-tag border-2 border-primary/30 text-inverse transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-on-accent";

const LINK_ROW =
  "flex min-h-[44px] items-center gap-3 text-sm text-inverse/70 transition duration-snap ease-snap hover:text-accent";

const Footer = () => {
  const socials = [
    { icon: MessageCircle, label: "WhatsApp", href: whatsappUrl() },
    { icon: Facebook, label: "Facebook", href: STORE.facebook },
    { icon: TikTokIcon, label: "TikTok", href: STORE.tiktok },
  ];

  const contacts = [
    {
      icon: MessageCircle,
      text: "Order on WhatsApp",
      href: whatsappUrl("Hello Brothers Sports House! I'd like to order."),
    },
    { icon: Phone, text: `+977 ${STORE.phone.slice(3)}`, href: `tel:+${STORE.phone}` },
    { icon: MapPin, text: STORE.location, href: null },
  ];

  return (
    /* Ink ground under a 3px rule — no blur blob, no glow. */
    <footer className="band border-t-[3px] border-accent">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-tag border-2 border-primary/30 bg-accent font-display text-2xl font-bold leading-none text-on-accent">
                B
              </span>
              <span>
                <span className="block font-display text-2xl font-bold uppercase leading-none text-inverse">
                  Brothers
                </span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                  Sports House
                </span>
              </span>
            </div>
            <p className="max-w-[62ch] text-sm leading-relaxed text-inverse/70">
              Football boots, club jerseys, team kit, Kelme balls and trophies out of
              Chaudhary Market in Bardibas, shipped across Nepal on cash on delivery.
            </p>

            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={SOCIAL_LINK}
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h2 className={COLUMN_HEADING}>Shop by category</h2>
            <ul className="mt-6">
              {categories.map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                    className={LINK_ROW}
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-tag bg-accent" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h2 className={COLUMN_HEADING}>Customer support</h2>
            <ul className="mt-6">
              <li>
                <Link to="/dashboard/orders" className={LINK_ROW}>
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-tag bg-accent" />
                  Order tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className={COLUMN_HEADING}>Get in touch</h2>
            <div className="mt-6 space-y-2">
              {contacts.map((contact) =>
                contact.href ? (
                  <a key={contact.text} href={contact.href} className={LINK_ROW}>
                    <contact.icon className="h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
                    {contact.text}
                  </a>
                ) : (
                  <p
                    key={contact.text}
                    className="flex min-h-[44px] items-center gap-3 text-sm text-inverse/70"
                  >
                    <contact.icon className="h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
                    {contact.text}
                  </p>
                )
              )}
            </div>

            {/* Payment Methods */}
            <div className="mt-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-inverse/70">
                We accept
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Cash on Delivery", "eSewa QR", "Khalti QR", "Bank Transfer"].map((method) => (
                  <span
                    key={method}
                    className="rounded-tag border-[1.5px] border-primary/30 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-inverse/70"
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
      <div className="border-t border-primary/20">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-inverse/70">
            <span className="tabular-nums">&copy; {new Date().getFullYear()}</span>{" "}
            {STORE.name}. Made with{" "}
            <Heart className="inline h-3 w-3 fill-accent text-accent" aria-hidden="true" /> in
            Nepal.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
