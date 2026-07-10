import type { UserCosmetics, VipLevel } from "@/api/types";

export function isVipActive(user: UserCosmetics): boolean {
  return !!user.vipLevel && !!user.vipExpiresAt && new Date(user.vipExpiresAt) > new Date();
}

export function resolveFrame(
  user: UserCosmetics,
  vipLevels?: VipLevel[],
): { color: string; emoji: string } | null {
  if (isVipActive(user) && vipLevels) {
    const level = vipLevels.find((l) => l.level === user.vipLevel);
    if (level) {
      return { color: level.frameColorHex, emoji: level.frameEmoji };
    }
  }
  if (user.activeFrame) {
    return { color: user.activeFrame.colorHex, emoji: user.activeFrame.emoji };
  }
  return null;
}

export function resolveVipBadge(user: UserCosmetics, vipLevels?: VipLevel[]): string | null {
  if (!isVipActive(user) || !vipLevels) return null;
  const level = vipLevels.find((l) => l.level === user.vipLevel);
  return level ? level.name : `VIP ${user.vipLevel}`;
}
