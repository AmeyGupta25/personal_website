import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Bricolage Grotesque'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "Menlo", "monospace"],
      },
      colors: {
        // the warehouse world; values live in src/index.css so colourways can swap them
        wh: {
          paper: "rgb(var(--wh-paper) / <alpha-value>)",
          ink: "rgb(var(--wh-ink) / <alpha-value>)",
          body: "rgb(var(--wh-body) / <alpha-value>)",
          mute: "rgb(var(--wh-mute) / <alpha-value>)",
          faint: "rgb(var(--wh-faint) / <alpha-value>)",
          line: "rgb(var(--wh-line) / <alpha-value>)",
          chip: "rgb(var(--wh-chip) / <alpha-value>)",
          soft: "rgb(var(--wh-soft) / <alpha-value>)",
          hover: "rgb(var(--wh-hover) / <alpha-value>)",
          hl: "rgb(var(--wh-hl) / <alpha-value>)",
          join: "rgb(var(--wh-join) / <alpha-value>)",
          kw: "rgb(var(--wh-kw) / <alpha-value>)",
          str: "rgb(var(--wh-str) / <alpha-value>)",
          link: "rgb(var(--wh-link) / <alpha-value>)",
          err: "rgb(var(--wh-err) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
