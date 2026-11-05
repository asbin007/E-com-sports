/** @type {import('tailwindcss').Config} */
/* Kit Room design system — see frontend/MASTER.md.
   Colours resolve through the CSS custom properties in src/index.css so both
   themes share one set of utility names. */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          hover: "rgb(var(--color-accent-hover) / <alpha-value>)",
          light: "rgb(var(--color-accent-light) / <alpha-value>)",
        },
        // Semantic, deliberately not the accent: stock and delivery success
        // read pitch, offers and festival moments read sale.
        sale: {
          DEFAULT: "rgb(var(--color-sale) / <alpha-value>)",
          bright: "rgb(var(--color-sale-bright) / <alpha-value>)",
          soft: "rgb(var(--color-sale-bg) / <alpha-value>)",
        },
        pitch: "rgb(var(--color-pitch) / <alpha-value>)",
      },
      backgroundColor: {
        primary: "rgb(var(--color-bg-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-bg-secondary) / <alpha-value>)",
        tertiary: "rgb(var(--color-bg-tertiary) / <alpha-value>)",
        card: "rgb(var(--color-bg-card) / <alpha-value>)",
        elevated: "rgb(var(--color-bg-elevated) / <alpha-value>)",
        inverse: "rgb(var(--color-bg-inverse) / <alpha-value>)",
        "surface-hover": "rgb(var(--color-surface-hover) / <alpha-value>)",
        "sale-soft": "rgb(var(--color-sale-bg) / <alpha-value>)",
        "sale-bright": "rgb(var(--color-sale-bright) / <alpha-value>)",
        // So `.eyebrow`'s trailing hairline and any divider can use the border
        // token as a fill. Without this the utility does not exist and
        // @apply fails at CSS compile time.
        "border-primary": "rgb(var(--color-border-primary) / <alpha-value>)",
      },
      textColor: {
        primary: "rgb(var(--color-text-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        tertiary: "rgb(var(--color-text-tertiary) / <alpha-value>)",
        muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        inverse: "rgb(var(--color-text-inverse) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        sale: "rgb(var(--color-sale) / <alpha-value>)",
        pitch: "rgb(var(--color-pitch) / <alpha-value>)",
        // The only text colour that is safe on a bright fill in BOTH themes.
        "ink-fixed": "rgb(var(--color-ink-fixed) / <alpha-value>)",
        // What sits on top of an accent fill. Brass needs graphite, bronze
        // needs white — so this flips with the theme and `text-white` must
        // never be hardcoded on `bg-accent`.
        "on-accent": "rgb(var(--color-on-accent) / <alpha-value>)",
        "on-sale": "rgb(var(--color-on-sale) / <alpha-value>)",
      },
      borderColor: {
        "border-primary": "rgb(var(--color-border-primary) / <alpha-value>)",
        "border-secondary": "rgb(var(--color-border-secondary) / <alpha-value>)",
        inverse: "rgb(var(--color-bg-inverse) / <alpha-value>)",
        sale: "rgb(var(--color-sale) / <alpha-value>)",
        pitch: "rgb(var(--color-pitch) / <alpha-value>)",
      },
      fontFamily: {
        // Mukta and Teko both carry Devanagari as well as Latin, so Nepali and
        // English set in the same voice instead of falling back to a system face.
        sans: ["Mukta", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Teko", "Oswald", "Arial Narrow", "sans-serif"],
      },
      borderRadius: {
        // Nothing rounder than a printed tag.
        tag: "2px",
        card: "4px",
      },
      boxShadow: {
        // The only depth in the system: a hard offset, like a tag lifting off
        // the page. No blur, ever.
        hard: "4px 4px 0 rgb(var(--color-bg-inverse))",
        "hard-sm": "2px 2px 0 rgb(var(--color-bg-inverse))",
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(.2, .7, .3, 1)",
      },
      transitionDuration: {
        snap: "120ms",
      },
      animation: {
        reveal: "reveal 160ms cubic-bezier(.2,.7,.3,1) both",
        "fade-in": "reveal 160ms cubic-bezier(.2,.7,.3,1) both",
        "slide-in": "slide-up 120ms cubic-bezier(.2,.7,.3,1) both",
        "scale-in": "reveal 160ms cubic-bezier(.2,.7,.3,1) both",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};
