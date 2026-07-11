export const colors = {
  background: "#0f1020",
  surface: "#1c1e3a",
  surfaceAlt: "#151728",
  surfaceMuted: "#2a2c50",
  primary: "#5b4cf5",
  primaryLight: "#7c6cf9",
  gold: "#f5c451",
  diamond: "#7fd8e8",
  success: "#4cd964",
  danger: "#ff6b6b",
  giftPink: "#ff3d9a",
  accentBlue: "#2e86ff",
  accentTeal: "#17d4c4",
  accentOrange: "#ff9642",
  accentPurple: "#a83ffb",
  textPrimary: "#ffffff",
  textSecondary: "#aab0d8",
  textMuted: "#7c86c9",
};

// Reusable colorful gradient pairs for headers, badges, and podium cards.
export const gradients = {
  header: [colors.primary, "#8a3ffb"] as const,
  gold: ["#ffd76a", "#f5a623"] as const,
  blue: ["#4facfe", "#2e6bff"] as const,
  pink: ["#ff5f9e", "#c22bd6"] as const,
  purple: ["#8a3ffb", "#5b4cf5"] as const,
  teal: ["#17d4c4", "#0f9bd8"] as const,
  orange: ["#ffb347", "#ff6b6b"] as const,
  sunset: ["#ff9a5a", "#ff3d9a", "#8a3ffb"] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const typography = {
  title: { fontSize: 24, fontWeight: "800" as const },
  heading: { fontSize: 18, fontWeight: "700" as const },
  body: { fontSize: 14, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "400" as const },
};

const AVATAR_PALETTE = ["#5b4cf5", "#00b894", "#f5a623", "#e84393", "#0984e3", "#e17055"];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function initialsOf(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
