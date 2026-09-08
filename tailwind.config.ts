import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#20241f",
        paper: "#f6f4ee",
        paper2: "#ece8dc",
        line: "#d8d2c0",
        orange: "#d9541f",
        orangedark: "#b8420f",
        steel: "#3c5a6b",
        green: "#4c7a52",
        amber: "#a67c1f",
        red: "#b3372c",
      },
    },
  },
  plugins: [],
};

export default config;
