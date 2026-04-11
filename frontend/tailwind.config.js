/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F0F0F",
        ivory: "#F8F1E9",
        maroon: {
          DEFAULT: "#3B0A0A",
          deep: "#2A0606",
          light: "#5C1515",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E8C85C",
          dark: "#B8941F",
          muted: "#8A7029",
        },
        saffron: {
          DEFAULT: "#E8A849",
          soft: "rgba(232, 168, 73, 0.35)",
        },
        copper: "#B87333",
        bronze: "#A67C52",
        /** Legacy token: maps to royal gold for CTAs & highlights */
        primary: "#D4AF37",
        /** Deep heritage surfaces & emphasis */
        secondary: "#3B0A0A",
        accent: "#C9A227",
        background: {
          DEFAULT: "#141110",
          elevated: "#1C1816",
          card: "#12100F",
          dark: "#0F0F0F",
        },
        /** Semantic tokens — backed by CSS custom properties.
         *  These switch automatically with the active theme.
         *  Use these in new components for future-proof theming. */
        rv: {
          bg:         "var(--rv-bg-page)",
          surface:    "var(--rv-bg-elevated)",
          card:       "var(--rv-bg-card)",
          input:      "var(--rv-bg-input)",
          hover:      "var(--rv-bg-hover)",
          "glass-nav":  "var(--rv-glass-nav)",
          "glass-panel":"var(--rv-glass-panel)",
          overlay:    "var(--rv-overlay)",
          border:     "var(--rv-border-subtle)",
          "border-md":"var(--rv-border-medium)",
          "border-lg":"var(--rv-border-strong)",
          text:       "var(--rv-text-primary)",
          "text-2":   "var(--rv-text-secondary)",
          "text-muted":"var(--rv-text-muted)",
          "text-faint":"var(--rv-text-faint)",
          "text-accent":"var(--rv-text-accent)",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        display: ["Cormorant Garamond", "Georgia", "serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem,6vw,4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2rem,4vw,3rem)", { lineHeight: "1.1" }],
      },
      backgroundImage: {
        "gradient-radial-hero":
          "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(212, 175, 55, 0.14), transparent 55%)",
        "gradient-gold": "linear-gradient(135deg, #E8C85C 0%, #D4AF37 40%, #B8941F 100%)",
        "gradient-gold-soft": "linear-gradient(90deg, rgba(212, 175, 55, 0.15), rgba(184, 115, 51, 0.12))",
        "gradient-maroon-fade": "linear-gradient(180deg, #3B0A0A 0%, transparent 100%)",
        "gradient-copper-bronze": "linear-gradient(135deg, #C17F3A 0%, #8B5A2B 50%, #6B4423 100%)",
        "texture-paper":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        glow: "0 0 40px rgba(212, 175, 55, 0.15)",
        "glow-sm": "0 0 20px rgba(212, 175, 55, 0.12)",
        "glow-lg": "0 0 60px rgba(212, 175, 55, 0.2)",
        "inner-gold": "inset 0 1px 0 rgba(232, 200, 92, 0.35)",
        card: "0 24px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(212, 175, 55, 0.12)",
        "card-hover": "0 28px 56px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(212, 175, 55, 0.28), 0 0 40px rgba(212, 175, 55, 0.08)",
      },
      animation: {
        "float-slow": "float 8s ease-in-out infinite",
        "float-delayed": "float 10s ease-in-out infinite 2s",
        shimmer: "shimmer 2.2s ease-in-out infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
        "wave-bar": "waveBar 1.2s ease-in-out infinite",
        "string-vibrate": "stringVibrate 0.35s ease-in-out infinite",
        "note-drift": "noteDrift 14s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(2deg)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%) skewX(-12deg)", opacity: "0" },
          "40%, 60%": { opacity: "0.35" },
          "100%": { transform: "translateX(200%) skewX(-12deg)", opacity: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
        waveBar: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        stringVibrate: {
          "0%, 100%": { transform: "translateX(0) scaleY(1)" },
          "25%": { transform: "translateX(0.5px) scaleY(1.02)" },
          "75%": { transform: "translateX(-0.5px) scaleY(0.98)" },
        },
        noteDrift: {
          "0%": { transform: "translateY(100vh) translateX(0) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "0.5" },
          "90%": { opacity: "0.35" },
          "100%": { transform: "translateY(-20vh) translateX(40px) rotate(18deg)", opacity: "0" },
        },
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
}
