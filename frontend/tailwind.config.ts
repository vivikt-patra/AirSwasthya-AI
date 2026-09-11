import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        leaf: "#2f7d5b",
        olive: "#8b9a4f",
        amberAir: "#f4b63d",
        clay: "#f08a3e",
        warmRed: "#d95757",
        ink: "#14211b"
      },
      boxShadow: {
        glass: "0 24px 70px rgba(54, 68, 61, 0.16)",
        focusLift: "0 18px 42px rgba(47, 125, 91, 0.18)"
      },
      borderRadius: {
        glass: "28px"
      }
    }
  },
  plugins: []
};

export default config;
