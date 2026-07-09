export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  globalRole: string;
}

export interface RechargeWallet {
  id: string;
  balance: string;
  frozenBalance: string;
  currency: string;
}

export interface AgentDashboard {
  availableBalance: number;
  frozenBalance: number;
  dailyChargeTotal: number;
  dailyChargeCount: number;
  weeklyChargeTotal: number;
  monthlyChargeTotal: number;
  totalCustomers: number;
  totalTransactions: number;
  totalEarnings: number;
  totalCommissionEarned: number;
  pendingWithdrawals: number;
}

export type ApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED"
  | "SUSPENDED";

export interface RechargeAgencyApplication {
  id: string;
  status: ApplicationStatus;
  agencyName: string;
  reviewNotes: string | null;
}

export interface RoomSummary {
  id: string;
  name: string;
  isPasswordProtected: boolean;
  seatCount: number;
  createdAt: string;
  owner: { id: string; username: string; fullName: string };
  _count: { members: number };
}

export interface RoomSeat {
  id: string;
  seatNumber: number;
  occupantId: string | null;
  isLocked: boolean;
  isMuted: boolean;
  occupant: { id: string; username: string; avatarUrl: string | null } | null;
}

export type RoomMemberRole = "OWNER" | "CO_OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";

export interface RoomMember {
  id: string;
  userId: string;
  role: RoomMemberRole;
  isMuted: boolean;
  isBanned: boolean;
  user: { id: string; username: string; fullName: string; avatarUrl: string | null };
}

export interface RoomDetail {
  id: string;
  name: string;
  isPasswordProtected: boolean;
  seatCount: number;
  seats: RoomSeat[];
  members: RoomMember[];
}

export interface ConversationSummary {
  id: string;
  otherUser: { id: string; username: string; fullName: string; avatarUrl: string | null };
  lastMessage: { body: string; createdAt: string; isDeleted: boolean } | null;
  isPinned: boolean;
  isMuted: boolean;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  replyToId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender: { id: string; username: string; avatarUrl: string | null };
}

export interface UserWallet {
  id: string;
  goldBalance: string;
  diamondBalance: string;
}

export type GiftType = "STATIC" | "LUCKY";

export interface Gift {
  id: string;
  name: string;
  iconUrl: string | null;
  price: string;
  type: GiftType;
  diamondShareRate: string;
}

export interface GiftSend {
  id: string;
  senderId: string;
  recipientId: string;
  giftId: string;
  roomId: string | null;
  quantity: number;
  totalGoldCost: string;
  diamondsAwarded: string;
  isLucky: boolean;
  luckyMultiplier: string | null;
  luckyPayoutGold: string | null;
  sender: { id: string; username: string; avatarUrl: string | null };
  recipient: { id: string; username: string; avatarUrl: string | null };
  gift: Gift;
}

export interface DiceGameSettings {
  minBet: string;
  maxBet: string;
  winMultiplier: string;
  dailyBetLimit: string;
}

export interface DiceGameRound {
  id: string;
  playerId: string;
  roomId: string | null;
  betAmount: string;
  choice: number;
  rolledNumber: number;
  multiplier: string;
  payout: string;
  isWin: boolean;
}

export interface PlayDiceResult {
  round: DiceGameRound;
  goldBalance: number;
}
