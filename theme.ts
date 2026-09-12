import { defineTheme } from "@astryxdesign/core/theme";

export const echoTheme = defineTheme({
  name: "echo",

  color: { accent: ["#FF6B4A", "#FF8566"], neutralStyle: "warm", contrast: "standard" },

  typography: {
    scale: { base: 16, ratio: 1.2 },
    body: { family: "PT Sans", fallbacks: "-apple-system, system-ui, sans-serif" },
    heading: {
      family: "Nunito",
      fallbacks: "-apple-system, system-ui, sans-serif",
      weight: "bold",
      weights: { 1: "bold", 2: "bold", 3: "bold" },
    },
  },

  radius: { base: 5, multiplier: 1.6 },

  motion: { fast: 150, medium: 200, slow: 500, ratio: 0.75 },

  tokens: {
    "--color-accent": ["#FF6B4A", "#FF8566"],
    "--color-on-accent": ["#FFFFFF", "#231D18"],
    "--color-background-body": ["#FFF9F5", "#171310"],
    "--color-background-surface": ["#FFFFFF", "#231D18"],
    "--color-background-card": ["#FFFFFF", "#231D18"],
    "--color-text-primary": ["#2A211A", "#F5EEE7"],
    "--color-text-secondary": ["#7A6A5D", "#B7A99B"],
    "--color-border": ["#F0E4DA", "#3A2F27"],
    "--color-success": ["#1FA97E", "#4FD79A"],
    "--color-warning": ["#E8A23D", "#F0BE6E"],
    "--radius-container": "20px",
    "--radius-element": "14px",
    "--shadow-low": "0 2px 8px light-dark(rgba(42,33,26,0.06), rgba(0,0,0,0.3))",
    "--shadow-med": "0 12px 24px light-dark(rgba(42,33,26,0.08), rgba(0,0,0,0.35))",
    "--focus-outline-color": "var(--color-accent)",
  },

  components: {
    button: {
      "variant:primary": {
        fontWeight: "var(--font-weight-bold)",
        ":active": { transform: "translateY(1px) scale(0.99)" },
      },
    },
    card: {
      base: {
        borderRadius: "var(--radius-container)",
        boxShadow: "var(--shadow-low), var(--shadow-med)",
        borderWidth: "0",
      },
    },
  },
});
