import { BadRequestException } from "@nestjs/common";
import { RechargeChargeService } from "./recharge-charge.service";

describe("RechargeChargeService", () => {
  const agent = {
    id: "agent-1",
    userId: "user-1",
    commissionRate: 5,
    wallet: { balance: 500 },
    agency: { commissionRate: 2 },
  };

  const settings = {
    dailyChargeLimit: 5000,
    largeTransactionAlert: 1000,
    goldPerCurrencyUnit: 100,
  };

  it("computes and splits commissions correctly for a successful charge", async () => {
    const notifications = { send: jest.fn().mockResolvedValue({}) };
    const settingsService = { getSettings: jest.fn().mockResolvedValue(settings) };

    const prisma: any = {
      rechargeTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: "tx-1", ...data })),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ id: "target-user" }) },
      rechargeAgent: { findUniqueOrThrow: jest.fn().mockResolvedValue(agent) },
      rechargeWallet: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    prisma.$transaction = jest.fn(async (callback: (tx: unknown) => unknown) => callback(prisma));

    const walletService = {
      creditGold: jest.fn().mockResolvedValue({}),
      getOrCreateWallet: jest.fn().mockResolvedValue({ goldBalance: 0 }),
    };

    const service = new RechargeChargeService(
      prisma,
      notifications as any,
      settingsService as any,
      walletService as any,
    );

    const result = await service.chargeUser(
      "agent-1",
      { targetUserId: "target-user", amount: 100 },
      {},
    );

    expect(result.agentCommission).toBeCloseTo(5);
    expect(result.agencyCommission).toBeCloseTo(2);
    expect(result.platformShare).toBeCloseTo(93);
    expect(result.status).toEqual("SUCCESS");
    expect(prisma.rechargeWallet.updateMany).toHaveBeenCalledWith({
      where: { agentId: "agent-1", balance: { gte: 100 } },
      data: { balance: { decrement: 100 } },
    });
  });

  it("rejects a charge that exceeds the agent's wallet balance", async () => {
    const notifications = { send: jest.fn().mockResolvedValue({}) };
    const settingsService = { getSettings: jest.fn().mockResolvedValue(settings) };

    const poorAgent = { ...agent, wallet: { balance: 10 } };
    const prisma: any = {
      rechargeTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        create: jest.fn().mockResolvedValue({}),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ id: "target-user" }) },
      rechargeAgent: { findUniqueOrThrow: jest.fn().mockResolvedValue(poorAgent) },
    };
    prisma.$transaction = jest.fn(async (callback: (tx: unknown) => unknown) => callback(prisma));

    const walletService = {
      creditGold: jest.fn().mockResolvedValue({}),
      getOrCreateWallet: jest.fn().mockResolvedValue({ goldBalance: 0 }),
    };

    const service = new RechargeChargeService(
      prisma,
      notifications as any,
      settingsService as any,
      walletService as any,
    );

    await expect(
      service.chargeUser("agent-1", { targetUserId: "target-user", amount: 100 }, {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
