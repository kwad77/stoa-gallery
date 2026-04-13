import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        panel: "#12151d",
        border: "#1f2433",
        ink: "#e9ecf3",
        muted: "#8892a6",
        accent: "#7aa2f7",
        ok: "#9ece6a",
        warn: "#e0af68",
        err: "#f7768e",
        iter: "#bb9af7"
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
