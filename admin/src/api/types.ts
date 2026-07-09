export type GlobalRole = "USER" | "RECHARGE_MANAGER" | "OWNER";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  globalRole: GlobalRole;
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
