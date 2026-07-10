const LEVEL_THRESHOLDS = [0, 500, 2000, 8000, 20000, 50000, 120000, 300000, 700000, 1500000];

export interface LevelInfo {
  level: number;
  exp: number;
  currentThreshold: number;
  nextThreshold: number | null;
  progress: number;
}

export function computeLevel(exp: number): LevelInfo {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (exp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? null;
  const progress = nextThreshold ? (exp - currentThreshold) / (nextThreshold - currentThreshold) : 1;

  return { level, exp, currentThreshold, nextThreshold, progress };
}
