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
  textPrimary: "#ffffff",
  textSecondary: "#aab0d8",
  textMuted: "#7c86c9",
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
