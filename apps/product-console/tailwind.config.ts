import type { Config } from "tailwindcss";

export default {
  content: ["apps/product-console/index.html", "apps/product-console/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--console-ink)",
        muted: "var(--console-muted)",
        line: "var(--console-line)",
        canvas: "var(--console-canvas)",
        panel: "var(--console-panel)",
        action: "var(--console-action)",
        teal: "var(--console-teal)",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(24, 33, 47, 0.04), 0 12px 30px rgba(24, 33, 47, 0.06)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
