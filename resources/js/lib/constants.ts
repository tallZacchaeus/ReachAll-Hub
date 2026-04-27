// Centralised application constants — single source of truth for colours,
// stage styles, and role mappings used across multiple pages/components.

// ─── Brand colour values (hex) for SVG / chart attributes ────────────────────
// brand exception: CSS classes use the token system (bg-brand,
// text-brand-yellow, etc.). Recharts fill/stroke attributes and React inline
// style={{}} props need raw colour strings, not CSS variables. These
// constants are the single source of truth for those callers and MUST stay
// in sync with --brand and --brand-yellow in resources/css/app.css.
export const BRAND_GREEN = "#1F6E4A";
export const BRAND_YELLOW = "#FFD400";

// ─── Chart colour palettes ────────────────────────────────────────────────────
export const CHART_COLORS_LIGHT = {
  primary: "#1F6E4A",
  secondary: "#d97706",
  tertiary: "#2563eb",
  quaternary: "#7c3aed",
  danger: "#dc2626",
  gridLine: "#e5e7eb",
  axisText: "#6b7280",
  tooltipBg: "white",
  tooltipBorder: "#e5e7eb",
} as const;

export const CHART_COLORS_DARK = {
  primary: "#4ade80",
  secondary: "#fbbf24",
  tertiary: "#60a5fa",
  quaternary: "#a78bfa",
  danger: "#f87171",
  gridLine: "#374151",
  axisText: "#9ca3af",
  tooltipBg: "#1e3527",
  tooltipBorder: "#374151",
} as const;

export type ChartColors = {
  readonly primary: string;
  readonly secondary: string;
  readonly tertiary: string;
  readonly quaternary: string;
  readonly danger: string;
  readonly gridLine: string;
  readonly axisText: string;
  readonly tooltipBg: string;
  readonly tooltipBorder: string;
};

// Array form — use index to pick colours for chart series
export const CHART_COLOR_ARRAY_LIGHT = [
  CHART_COLORS_LIGHT.primary,
  CHART_COLORS_LIGHT.secondary,
  CHART_COLORS_LIGHT.tertiary,
  CHART_COLORS_LIGHT.quaternary,
  CHART_COLORS_LIGHT.danger,
  "#059669", // emerald
] as const;

export const CHART_COLOR_ARRAY_DARK = [
  CHART_COLORS_DARK.primary,
  CHART_COLORS_DARK.secondary,
  CHART_COLORS_DARK.tertiary,
  CHART_COLORS_DARK.quaternary,
  CHART_COLORS_DARK.danger,
  "#34d399", // lighter emerald
] as const;

// ─── Department colours (avatar backgrounds) ──────────────────────────────────
export const DEPT_COLORS: Record<string, string> = {
  "Video & Production": "bg-purple-500",
  "Project Management": "bg-blue-600",
  "Product Team": "bg-cyan-600",
  "Content & Brand Comms": "bg-pink-500",
  Interns: "bg-orange-400",
  "Incubator Team": "bg-yellow-500",
  "Skillup Team": "bg-lime-600",
  "DAF Team": "bg-teal-600",
  "Graphics Design": "bg-violet-600",
  Accounting: "bg-red-500",
  "Business Development": "bg-emerald-600",
};

// ─── Employee stage badge styles ──────────────────────────────────────────────
export const STAGE_STYLES: Record<string, string> = {
  joiner:
    "border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400",
  performer:
    "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
  leader:
    "border-purple-300 text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400",
};

// ─── Role display labels ───────────────────────────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
  staff: "Staff",
  management: "Management",
  hr: "HR",
  finance: "Finance",
  general_management: "General Management",
  ceo: "CEO",
  superadmin: "Super Admin",
};

// ─── Notification / status semantic colours ───────────────────────────────────
export const STATUS_COLORS = {
  success: "var(--brand)",
  warning: "var(--brand-yellow)",
  info: "#60a5fa",
  danger: "var(--destructive)",
} as const;
