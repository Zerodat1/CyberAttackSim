export type GlobalRole = "USER" | "RECHARGE_MANAGER" | "OWNER" | "ADMIN";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  globalRole: GlobalRole;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  globalRole: GlobalRole;
  isActive: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
}

export interface AdminUserList {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BannedIp {
  id: string;
  ipAddress: string;
  reason: string | null;
  createdAt: string;
  bannedBy: { id: string; username: string } | null;
}

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "SUSPENDED";

export interface RechargeAgencyApplication {
  id: string;
  applicantId: string;
  fullName: string;
  agencyName: string;
  country: string;
  city: string;
  phone: string;
  email: string;
  paymentMethods: string[];
  previousExperience: string | null;
  yearsOfExperience: number | null;
  idDocumentUrl: string | null;
  status: ApplicationStatus;
  reviewNotes: string | null;
  createdAt: string;
  applicant?: { id: string; username: string; fullName: string; email: string | null };
}

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface TopUpRequest {
  id: string;
  agentId: string;
  amount: string;
  paymentMethod: string;
  proofUrl: string | null;
  status: RequestStatus;
  createdAt: string;
  agent?: { user: { id: string; username: string } };
}

export interface WithdrawalRequest {
  id: string;
  agentId: string;
  amount: string;
  method: string;
  accountNumber: string;
  notes: string | null;
  status: RequestStatus;
  createdAt: string;
  agent?: { user: { id: string; username: string } };
}

export interface CommissionSettings {
  id: string;
  agentCommissionRate: string;
  agencyCommissionRate: string;
  platformRate: string;
  dailyChargeLimit: string;
  dailyWithdrawLimit: string;
  largeTransactionAlert: string;
  goldPerCurrencyUnit: string;
}

export type GiftType = "STATIC" | "LUCKY";

export interface LuckyOddEntry {
  multiplier: number;
  weight: number;
}

export interface Gift {
  id: string;
  name: string;
  iconUrl: string | null;
  price: string;
  type: GiftType;
  isActive: boolean;
  diamondShareRate: string;
  luckyOdds: LuckyOddEntry[] | null;
  createdAt: string;
}

export interface GameSettings {
  id: string;
  minBet: string;
  maxBet: string;
  winMultiplier: string;
  dailyBetLimit: string;
  winRatePercent: string;
  config: Record<string, unknown> | null;
}

export interface AdminStatsOverview {
  users: {
    total: number;
    active: number;
    newLast7Days: number;
    byRole: Record<GlobalRole, number>;
  };
  rechargeApplications: Record<string, number>;
  rechargeAgencies: Record<string, number>;
  topUpRequests: { byStatus: Record<string, number>; completedTotalAmount: string };
  withdrawalRequests: { byStatus: Record<string, number>; completedTotalAmount: string };
  platformRevenue: { totalPlatformShare: string };
  rooms: { total: number; active: number; totalMemberships: number };
  gifts: { totalSends: number; sendsLast7Days: number; totalGoldSpent: string };
  games: {
    totalRounds: number;
    totalBetAmount: string;
    totalPayout: string;
    byType: { gameType: string; rounds: number; wins: number }[];
  };
  hostAgencies: { total: number; active: number; totalMembers: number };
  wallet: { totalGold: string; totalDiamonds: string };
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
  createdAt: string;
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

export interface RechargePackage {
  id: string;
  priceUsd: string;
  baseGold: string;
  bonusPercent: string;
  totalGold: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface HostTargetTier {
  id: string;
  thresholdDiamonds: string;
  salaryUsd: string;
  sortOrder: number;
}

export interface HostEconomySettings {
  id: string;
  giftHostShareRate: string;
  agencyBaseRate: string;
  agencyTargetRate: string;
  agencyPremiumRate: string;
  diamondToUsdRate: string;
}

export interface HostAgencyAdminOverview {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  owner: { id: string; username: string; fullName: string; avatarUrl: string | null };
  _count: { members: number };
  isPremium: boolean;
  monthlyTargetDiamonds: string | null;
  monthlyDiamonds: string;
  commissionBalance: string;
}

export interface HostAgencyHostIncome {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: "OWNER" | "HOST";
  monthlyDiamonds: number;
  lifetimeDiamonds: number;
  currentTierSalaryUsd: number;
}

export interface HostAgencyDashboard {
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
  hosts: HostAgencyHostIncome[];
  withdrawalHistory: AgencyWithdrawalRequest[];
}

export interface HostWithdrawalRequest {
  id: string;
  hostId: string;
  diamondsAmount: string;
  usdAmount: string;
  method: string;
  accountNumber: string;
  notes: string | null;
  status: RequestStatus;
  createdAt: string;
  host?: { id: string; username: string; fullName: string };
}

export interface AgencyWithdrawalRequest {
  id: string;
  agencyId: string;
  usdAmount: string;
  method: string;
  accountNumber: string;
  notes: string | null;
  status: RequestStatus;
  createdAt: string;
  agency?: { id: string; name: string };
}
