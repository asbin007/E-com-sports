/** @type {import('tailwindcss').Config} */
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
      },
      backgroundColor: {
        primary: "rgb(var(--color-bg-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-bg-secondary) / <alpha-value>)",
        tertiary: "rgb(var(--color-bg-tertiary) / <alpha-value>)",
        card: "rgb(var(--color-bg-card) / <alpha-value>)",
        elevated: "rgb(var(--color-bg-elevated) / <alpha-value>)",
        inverse: "rgb(var(--color-bg-inverse) / <alpha-value>)",
        "surface-hover": "rgb(var(--color-surface-hover) / <alpha-value>)",
      },
      textColor: {
        primary: "rgb(var(--color-text-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        tertiary: "rgb(var(--color-text-tertiary) / <alpha-value>)",
        muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        inverse: "rgb(var(--color-text-inverse) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
      },
      borderColor: {
        "border-primary": "rgb(var(--color-border-primary) / <alpha-value>)",
        "border-secondary": "rgb(var(--color-border-secondary) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        "fade-in": "fade-in 0.8s ease-out",
        "slide-in": "slide-in 0.8s ease-out",
        "scale-in": "scale-in 0.8s ease-out",
        shimmer: "shimmer 2s infinite",
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
