/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sf-pro-display)", "sans-serif"],
      },
      animation: {
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        "fadeIn": "fadeIn 0.4s ease-out",
        "spring": "spring 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "glow": "glow 0.8s ease-out",
        "gradient-sweep": "gradient-sweep 8s linear infinite",
        "neon-glow": "neon-glow 3s ease-in-out infinite",
        "border-sweep": "border-sweep 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
        "fadeIn": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "spring": {
          "0%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(0.95)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        "glow": {
          "0%": {
            boxShadow: "0 0 0 0 rgba(0, 64, 184, 0)",
          },
          "50%": {
            boxShadow: "0 0 0 4px rgba(0, 64, 184, 0.6), 0 0 4px rgba(0, 64, 184, 0.2)",
          },
          "100%": {
            boxShadow: "0 0 0 0 rgba(0, 64, 184, 0)",
          },
        },
        "gradient-sweep": {
          "0%": {
            transform: "rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        "neon-glow": {
          "0%": {
            boxShadow: "0 0 2px rgba(0, 64, 184, 0.2), 0 0 4px rgba(0, 64, 184, 0.15)",
          },
          "50%": {
            boxShadow: "0 0 4px rgba(0, 64, 184, 0.4), 0 0 8px rgba(0, 64, 184, 0.25)",
          },
          "100%": {
            boxShadow: "0 0 2px rgba(0, 64, 184, 0.2), 0 0 4px rgba(0, 64, 184, 0.15)",
          },
        },
        "border-sweep": {
          "0%": {
            backgroundPosition: "0% 50%",
          },
          "100%": {
            backgroundPosition: "100% 50%",
          },
        },
        "shimmer": {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },
      },
    },
  },
  plugins: [],
}
