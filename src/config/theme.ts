/**
 * Crestix Probe Design Tokens & Color Conventions
 *
 * Charcoal: Deep space surfaces and dark canvas
 * Slate: Neutral structure, dividing borders, secondary text
 * Cyan: Primary accent for active telemetry, probe vectors, interactive highlights
 * Teal: Secondary accent for nominal status, calibrated sensors, confirmation
 * Muted Grey: Subordinate data labels, disabled states
 * White: High-contrast headings and vital telemetry values
 */
export const DESIGN_TOKENS = {
  colors: {
    charcoal: {
      950: "#07090e", // Root background
      900: "#0b0f17", // Sidebar, panels, cards
      850: "#101520", // Elevated cards
      800: "#151d2c", // Card hover, interactive dark
      700: "#1f293d", // Component borders
    },
    slate: {
      900: "#0f172a",
      800: "#1e293b",
      700: "#334155",
      600: "#475569",
      500: "#64748b",
      400: "#94a3b8",
      300: "#cbd5e1",
    },
    cyan: {
      950: "#082f49",
      900: "#0c4a6e",
      700: "#0e7490",
      600: "#0891b2",
      500: "#06b6d4", // Primary accent
      400: "#22d3ee", // Active state
      300: "#67e8f9",
    },
    teal: {
      950: "#042f2e",
      900: "#134e4a",
      700: "#0f766e",
      600: "#0d9488",
      500: "#14b8a6", // Secondary / Nominal accent
      400: "#2dd4bf",
      300: "#5eead4",
    },
    status: {
      nominal: "#14b8a6", // Teal
      telemetry: "#06b6d4", // Cyan
      warning: "#f59e0b", // Amber
      critical: "#ef4444", // Rose
      offline: "#64748b", // Grey
    },
  },
  borderRadius: {
    xs: "0.25rem", // 4px
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    full: "9999px",
  },
  spacing: {
    headerHeight: "4rem", // 64px
    sidebarWidth: "16rem", // 256px
    sidebarCollapsedWidth: "4.5rem", // 72px
  },
  transitions: {
    standard: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    sidebar: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;
