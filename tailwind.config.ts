import type { Config } from "tailwindcss";

// Helper: color semántico desde una variable CSS en canales "r g b".
const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: c("--background"),
        surface: {
          DEFAULT: c("--surface"),
          bright: c("--surface-bright"),
          subtle: c("--surface-subtle"),
          container: {
            lowest: c("--surface-container-lowest"),
            low: c("--surface-container-low"),
            DEFAULT: c("--surface-container"),
            high: c("--surface-container-high"),
            highest: c("--surface-container-highest"),
          },
        },
        "on-surface": {
          DEFAULT: c("--on-surface"),
          variant: c("--on-surface-variant"),
        },
        outline: {
          DEFAULT: c("--outline"),
          variant: c("--outline-variant"),
        },
        line: c("--line"),
        inverse: {
          surface: c("--inverse-surface"),
          "on-surface": c("--inverse-on-surface"),
        },
        primary: {
          DEFAULT: c("--primary"),
          container: c("--primary-container"),
          fixed: c("--primary-fixed"),
          "on-fixed": c("--on-primary-fixed-variant"),
        },
        "on-primary": {
          DEFAULT: c("--on-primary"),
          container: c("--on-primary-container"),
        },
        secondary: c("--secondary"),
        tertiary: {
          DEFAULT: c("--tertiary"),
          container: c("--tertiary-container"),
        },
        success: c("--success"),
        warning: c("--warning"),
        danger: c("--danger"),
        error: {
          DEFAULT: c("--error"),
          container: c("--error-container"),
          on: c("--on-error-container"),
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      fontSize: {
        "headline-xl": ["2.5rem", { lineHeight: "3rem", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "body-md": ["1rem", { lineHeight: "1.5rem" }],
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "label-lg": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-md": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.04em", fontWeight: "500" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      boxShadow: {
        // Elevación tonal del DESIGN.md
        e2: "0 4px 12px rgb(0 0 0 / 0.08)",
        e3: "0 12px 32px rgb(0 0 0 / 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
