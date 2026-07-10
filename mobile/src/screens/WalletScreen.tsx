import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import type { RechargePackage, RechargeTransaction } from "@/api/types";

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: "ناجحة",
  FAILED: "فشلت",
  REVERSED: "مسترجعة",
};

export function WalletScreen() {
  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await apiClient.get<{ goldBalance: string; diamondBalance: string }>("/wallet/me")).data,
  });

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["wallet-packages"],
    queryFn: async () => (await apiClient.get<RechargePackage[]>("/wallet/packages")).data,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["recharge-history"],
    queryFn: async () => (await apiClient.get<RechargeTransaction[]>("/wallet/recharge-history")).data,
  });

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      data={history ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <LinearGradient colors={[colors.primary, "#8a3ffb"]} style={styles.walletCard}>
            <View style={styles.walletItem}>
              <Text style={styles.walletValue}>{wallet?.goldBalance ?? "0"}</Text>
              <Text style={styles.walletLabel}>ذهب 💰</Text>
            </View>
            <View style={styles.walletDivider} />
            <View style={styles.walletItem}>
              <Text style={[styles.walletValue, { color: colors.diamond }]}>{wallet?.diamondBalance ?? "0"}</Text>
              <Text style={styles.walletLabel}>ألماس 💎</Text>
            </View>
          </LinearGradient>

          <Text style={styles.sectionTitle}>باقات الشحن المتوفرة</Text>
          <Text style={styles.sectionSubtitle}>توجه لأحد وكلاء الشحن لاختيار إحدى هذه الباقات — البونص يُضاف تلقائيًا</Text>
          {packagesLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
          <View style={styles.packagesRow}>
            {packages?.map((pkg) => {
              const hasBonus = Number(pkg.bonusPercent) > 0;
              return (
                <View key={pkg.id} style={styles.packageCard}>
                  <Text style={styles.packagePrice}>{pkg.priceUsd}$</Text>
                  <Text style={styles.packageGold}>{Number(pkg.totalGold).toLocaleString("en")} ذهب</Text>
                  {hasBonus && (
                    <View style={styles.bonusBadge}>
                      <Text style={styles.bonusBadgeText}>+{Number(pkg.bonusPercent)}% بونص</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>سجل الشحن</Text>
          {historyLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
          {!historyLoading && (history ?? []).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>لا يوجد سجل شحن بعد</Text>
            </View>
          )}
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.historyCard}>
          <View style={styles.historyRow}>
            <Text style={styles.historyAmount}>
              +{Number(item.goldCredited ?? 0).toLocaleString("en")} ذهب
            </Text>
            <View>
              <Text style={styles.historyPrice}>{item.amount}$</Text>
              {item.bonusPercent != null && Number(item.bonusPercent) > 0 && (
                <Text style={styles.historyBonus}>بونص {item.bonusPercent}%</Text>
              )}
            </View>
          </View>
          <View style={styles.historyRow}>
            <Text style={styles.historyStatus}>{STATUS_LABEL[item.status] ?? item.status}</Text>
            <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString("ar")}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  walletCard: {
    flexDirection: "row",
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  walletItem: { alignItems: "center", flex: 1 },
  walletDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  walletValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  walletLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "right",
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  packagesRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    minWidth: 100,
    alignItems: "center",
  },
  packagePrice: { color: colors.textPrimary, fontWeight: "800", fontSize: 16 },
  packageGold: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  bonusBadge: {
    backgroundColor: "rgba(76,217,100,0.18)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  bonusBadgeText: { color: colors.success, fontSize: 11, fontWeight: "700" },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 20, paddingHorizontal: spacing.xxl },
  emptyIcon: { fontSize: 34, marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  historyCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.sm },
  historyRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  historyAmount: { color: colors.gold, fontWeight: "700", fontSize: 14 },
  historyPrice: { color: colors.textPrimary, fontWeight: "700", textAlign: "left" },
  historyBonus: { color: colors.success, fontSize: 11, textAlign: "left" },
  historyStatus: { color: colors.textSecondary, fontSize: 12 },
  historyDate: { color: colors.textMuted, fontSize: 11 },
});
