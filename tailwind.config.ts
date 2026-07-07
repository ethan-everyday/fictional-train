import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Medieval palette: candlelit oak, parchment, antique gold.
      colors: {
        night: "#0f0b07", // page background — a room lit by embers
        oak: "#26190f", // panels and cards
        bark: {
          DEFAULT: "#46351f", // standard borders
          light: "#604b2e", // emphasized borders
        },
        parch: {
          100: "#f2e8ce", // brightest text / actual parchment surfaces
          200: "#e9dcba",
          300: "#dcc99f",
          400: "#c3aa7d",
          500: "#9d8459", // secondary text
          600: "#7c6845", // faint text
        },
        gold: {
          DEFAULT: "#d4a937", // illuminated gold — accents, drop caps
          dim: "#a8842c", // tarnished gold — quieter accents
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        prose: ["var(--font-prose)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
