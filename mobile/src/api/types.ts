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
