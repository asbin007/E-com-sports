import tiktok from "./tiktok.json";

/** Single source of truth for the shop's public identity (sourced from its TikTok profile). */
export const STORE = {
  name: "Brothers Sports House",
  /** Digits only, international format, no "+". */
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || tiktok.profile.whatsapp,
  phone: tiktok.profile.phone,
  location: tiktok.profile.location,
  facebook: tiktok.profile.facebook,
  tiktok: tiktok.profile.url,
  tiktokHandle: tiktok.profile.handle,
} as const;

export const whatsappUrl = (text?: string) =>
  `https://wa.me/${STORE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
