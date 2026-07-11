export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  globalRole: string;
  avatarUrl?: string | null;
}

export type Gender = "MALE" | "FEMALE";

export interface LevelInfo {
  level: number;
  exp: number;
  currentThreshold: number;
  nextThreshold: number | null;
  progress: number;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  country: string | null;
  gender: Gender | null;
  globalRole: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  vipLevel: number | null;
  vipExpiresAt: string | null;
  activeFrame: { emoji: string; colorHex: string } | null;
  activeEntrance: { emoji: string; colorHex: string } | null;
  activeBubble: { emoji: string; colorHex: string } | null;
  activeMicEffect: { emoji: string; colorHex: string } | null;
  levels: {
    wealth: LevelInfo;
    charm: LevelInfo;
  };
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
  diamondBalance: number;
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

export interface UserCosmetics {
  vipLevel: number | null;
  vipExpiresAt: string | null;
  activeFrame: { emoji: string; colorHex: string } | null;
  activeMicEffect: { emoji: string; colorHex: string } | null;
}

export interface RoomSeat {
  id: string;
  seatNumber: number;
  occupantId: string | null;
  isLocked: boolean;
  isMuted: boolean;
  occupant: ({ id: string; username: string; avatarUrl: string | null } & UserCosmetics) | null;
}

export type RoomMemberRole = "OWNER" | "CO_OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";

export interface RoomMember {
  id: string;
  userId: string;
  role: RoomMemberRole;
  isMuted: boolean;
  isBanned: boolean;
  user: { id: string; username: string; fullName: string; avatarUrl: string | null } & UserCosmetics;
}

export interface RoomDetail {
  id: string;
  name: string;
  isPasswordProtected: boolean;
  seatCount: number;
  backgroundUrl: string | null;
  seats: RoomSeat[];
  members: RoomMember[];
}

export interface RoomChatMessage {
  id: string;
  roomId: string;
  text: string;
  createdAt: string;
  sender: { id: string; username: string; fullName: string; avatarUrl: string | null };
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
  sender: {
    id: string;
    username: string;
    avatarUrl: string | null;
    activeBubble: { emoji: string; colorHex: string } | null;
  };
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

export type GameType = "DICE_GUESS" | "LUCKY_WHEEL" | "SLOT_MACHINE" | "CRASH_GUESS";

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

export interface WeightedTier {
  label: string;
  multiplier: number;
  weight: number;
}

export interface WheelGameSettings {
  minBet: string;
  maxBet: string;
  dailyBetLimit: string;
  config: { segments: WeightedTier[] };
}

export interface SlotsGameSettings {
  minBet: string;
  maxBet: string;
  dailyBetLimit: string;
  config: { tiers: WeightedTier[] };
}

export interface CrashGameSettings {
  minBet: string;
  maxBet: string;
  dailyBetLimit: string;
  config: { houseEdge: number; maxMultiplier: number };
}

export interface GameRound {
  id: string;
  gameType: GameType;
  playerId: string;
  roomId: string | null;
  betAmount: string;
  choice: number;
  rolledNumber: number;
  multiplier: string;
  payout: string;
  isWin: boolean;
  createdAt: string;
}

export interface PlayGameResult {
  round: GameRound;
  goldBalance: number;
}

export type HostAgencyRole = "OWNER" | "HOST";

interface HostAgencyUserRef {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface HostAgencySummary {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  owner: HostAgencyUserRef;
  _count: { members: number };
}

export interface HostAgencyMember {
  id: string;
  userId: string;
  role: HostAgencyRole;
  joinedAt: string;
  user: HostAgencyUserRef;
}

export interface HostAgencyDetail extends HostAgencySummary {
  members: HostAgencyMember[];
}

export interface HostAgencyMembership {
  id: string;
  agencyId: string;
  userId: string;
  role: HostAgencyRole;
  joinedAt: string;
  agency: HostAgencySummary;
}

export interface HostTargetTier {
  id: string;
  thresholdDiamonds: string;
  salaryUsd: string;
  sortOrder: number;
}

export interface HostWithdrawalRequest {
  id: string;
  hostId: string;
  diamondsAmount: string;
  usdAmount: string;
  method: string;
  accountNumber: string;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  createdAt: string;
}

export interface HostDashboard {
  agency: { id: string; name: string };
  lifetimeDiamonds: number;
  totalGoldReceived: number;
  monthlyDiamonds: number;
  currentTier: { thresholdDiamonds: number; salaryUsd: number } | null;
  nextTier: { thresholdDiamonds: number; salaryUsd: number } | null;
  progressPercent: number;
  expectedMonthlySalaryUsd: number;
  withdrawableDiamonds: number;
  withdrawableUsd: number;
  diamondToUsdRate: number;
  withdrawalHistory: HostWithdrawalRequest[];
}

export interface RechargePackage {
  id: string;
  priceUsd: string;
  baseGold: string;
  bonusPercent: string;
  totalGold: string;
  isActive: boolean;
  sortOrder: number;
}

export interface RechargeTransaction {
  id: string;
  transactionNumber: string;
  amount: string;
  goldCredited: string | null;
  bonusPercent: string | null;
  status: "SUCCESS" | "FAILED" | "REVERSED";
  createdAt: string;
}

export interface AgencyEarningsDashboard {
  agencyId: string;
  name: string;
  isPremium: boolean;
  monthlyTargetDiamonds: number | null;
  monthlyDiamonds: number;
  effectiveCommissionRate: number;
  commissionBalance: number;
  dailyProfitUsd: number;
  monthlyProfitUsd: number;
  hostsCount: number;
  hosts: {
    userId: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    role: "OWNER" | "HOST";
    monthlyDiamonds: number;
    lifetimeDiamonds: number;
    currentTierSalaryUsd: number;
  }[];
  withdrawalHistory: {
    id: string;
    usdAmount: string;
    method: string;
    accountNumber: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    createdAt: string;
  }[];
}

export type StoreItemCategory = "FRAME" | "ENTRANCE" | "BUBBLE" | "MIC_EFFECT";

export interface StoreItem {
  id: string;
  category: StoreItemCategory;
  name: string;
  emoji: string;
  colorHex: string;
  priceGold: string;
  durationDays: number | null;
  isActive: boolean;
  owned: boolean;
  expiresAt: string | null;
}

export interface OwnedStoreItem extends StoreItem {
  purchasedAt: string;
  expired: boolean;
}

export interface StoreInventory {
  items: OwnedStoreItem[];
  equipped: {
    activeFrameId: string | null;
    activeEntranceId: string | null;
    activeBubbleId: string | null;
    activeMicEffectId: string | null;
  };
}

export interface VipLevel {
  level: number;
  name: string;
  priceGold: string;
  durationDays: number;
  badgeColor: string;
  frameColorHex: string;
  frameEmoji: string;
  entranceText: string;
  entranceColorHex: string;
  isActive: boolean;
}

export interface VipStatus {
  vipLevel: number | null;
  vipExpiresAt: string | null;
  isActive: boolean;
  current: VipLevel | null;
}

export type HostAgentWithdrawalStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PAID"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUNDED";

export interface AvailableCashoutAgent {
  id: string;
  user: { id: string; username: string; fullName: string; avatarUrl: string | null };
  agencyName: string;
}

export interface HostAgentWithdrawalRequest {
  id: string;
  hostId: string;
  rechargeAgentId: string;
  diamondsAmount: string;
  usdAmount: string;
  payoutMethod: string;
  payoutAccount: string;
  status: HostAgentWithdrawalStatus;
  proofUrl: string | null;
  paymentReference: string | null;
  rejectionReason: string | null;
  acceptedAt: string | null;
  paidAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  rechargeAgent?: { user: { id: string; username: string; fullName: string } };
  host?: { id: string; username: string; fullName: string; avatarUrl: string | null };
}
