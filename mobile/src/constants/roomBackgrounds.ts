export interface RoomBackgroundPreset {
  id: string;
  label: string;
  colors: [string, string];
}

export const ROOM_BACKGROUND_PRESETS: RoomBackgroundPreset[] = [
  { id: "purple", label: "بنفسجي", colors: ["#3a1f6e", "#0a0a1a"] },
  { id: "crimson", label: "أحمر داكن", colors: ["#4a0e0e", "#150404"] },
  { id: "gold", label: "ذهبي", colors: ["#4a3a10", "#151008"] },
  { id: "teal", label: "فيروزي", colors: ["#0e3a3a", "#041515"] },
  { id: "pink", label: "وردي", colors: ["#4a0e3a", "#150415"] },
  { id: "forest", label: "أخضر", colors: ["#0e3a1a", "#041508"] },
  { id: "midnight", label: "أسود", colors: ["#141428", "#000000"] },
  { id: "sunset", label: "غروب", colors: ["#4a2a0e", "#150c04"] },
];

const GRADIENT_PREFIX = "gradient:";

export function gradientBackgroundKey(presetId: string): string {
  return `${GRADIENT_PREFIX}${presetId}`;
}

export function resolveRoomBackground(backgroundUrl: string | null | undefined): {
  kind: "default" | "gradient" | "image";
  colors: [string, string];
  imageUrl?: string;
} {
  if (!backgroundUrl) {
    return { kind: "default", colors: ROOM_BACKGROUND_PRESETS[0].colors };
  }
  if (backgroundUrl.startsWith(GRADIENT_PREFIX)) {
    const presetId = backgroundUrl.slice(GRADIENT_PREFIX.length);
    const preset = ROOM_BACKGROUND_PRESETS.find((p) => p.id === presetId);
    return { kind: "gradient", colors: preset?.colors ?? ROOM_BACKGROUND_PRESETS[0].colors };
  }
  return { kind: "image", colors: ROOM_BACKGROUND_PRESETS[0].colors, imageUrl: backgroundUrl };
}
