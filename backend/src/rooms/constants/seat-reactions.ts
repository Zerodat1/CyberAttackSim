export interface SeatReaction {
  id: string;
  emoji: string | null;
}

export const SEAT_REACTIONS: SeatReaction[] = [
  { id: "laugh", emoji: "😂" },
  { id: "heart_eyes", emoji: "😍" },
  { id: "party", emoji: "🥳" },
  { id: "kiss", emoji: "😘" },
  { id: "cool", emoji: "😎" },
  { id: "fire", emoji: "🔥" },
  { id: "crown", emoji: "👑" },
  { id: "dance", emoji: "💃" },
  { id: "shy", emoji: "🙈" },
  { id: "chill", emoji: "☕" },
  { id: "shh", emoji: "🤫" },
  { id: "code_hype", emoji: null },
];

export const SEAT_REACTION_IDS = SEAT_REACTIONS.map((r) => r.id);
