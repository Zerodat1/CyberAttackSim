export interface SeatReaction {
  id: string;
  emoji: string | null;
  label: string;
}

export const SEAT_REACTIONS: SeatReaction[] = [
  { id: "laugh", emoji: "😂", label: "ضحك" },
  { id: "heart_eyes", emoji: "😍", label: "إعجاب" },
  { id: "party", emoji: "🥳", label: "احتفال" },
  { id: "kiss", emoji: "😘", label: "قبلة" },
  { id: "cool", emoji: "😎", label: "كول" },
  { id: "fire", emoji: "🔥", label: "نار" },
  { id: "crown", emoji: "👑", label: "تاج" },
  { id: "dance", emoji: "💃", label: "رقص" },
  { id: "shy", emoji: "🙈", label: "خجل" },
  { id: "chill", emoji: "☕", label: "استرخاء" },
  { id: "shh", emoji: "🤫", label: "سر" },
  { id: "code_hype", emoji: null, label: "Code" },
];

export function findSeatReaction(id: string): SeatReaction | undefined {
  return SEAT_REACTIONS.find((r) => r.id === id);
}
