import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import type { AgentDashboard } from "@/api/types";
import { colors, radii, spacing, typography } from "@/theme";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "AgentDashboard">;

const STAT_TILES: { key: keyof AgentDashboard; label: string; icon: string; suffix?: string }[] = [
  { key: "dailyChargeTotal", label: "شحن اليوم", icon: "📅", suffix: "$" },
  { key: "weeklyChargeTotal", label: "شحن الأسبوع", icon: "🗓️", suffix: "$" },
  { key: "monthlyChargeTotal", label: "شحن الشهر", icon: "📈", suffix: "$" },
  { key: "totalCustomers", label: "عدد العملاء", icon: "👥" },
  { key: "totalTransactions", label: "عدد العمليات", icon: "🧾" },
  { key: "totalCommissionEarned", label: "إجمالي العمولات", icon: "💵", suffix: "$" },
  { key: "frozenBalance", label: "الرصيد المجمد", icon: "🧊", suffix: "$" },
  { key: "pendingWithdrawals", label: "طلبات سحب معلقة", icon: "⏳", suffix: "$" },
];

function StatTile({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export function AgentDashboardScreen({ navigation }: Props) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["agent-dashboard"],
    queryFn: async () => (await apiClient.get<AgentDashboard>("/recharge-agency/dashboard")).data,
  });

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <LinearGradient colors={["#2a2c60", "#1c1e3a"]} style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>الرصيد المتاح للشحن</Text>
        <Text style={styles.balance}>{data.availableBalance.toFixed(2)}$</Text>
      </LinearGradient>

      <View style={styles.grid}>
        {STAT_TILES.map((tile) => (
          <StatTile
            key={tile.key}
            icon={tile.icon}
            label={tile.label}
            value={`${data[tile.key]}${tile.suffix ?? ""}`}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ChargeUser")}>
        <Text style={styles.buttonText}>شحن مستخدم</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate("WithdrawalRequest")}>
        <Text style={styles.buttonSecondaryText}>طلب سحب أرباح</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate("AgentCashoutInbox")}>
        <Text style={styles.buttonSecondaryText}>طلبات سحب المضيفين</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonGhost} onPress={() => refetch()} disabled={isRefetching}>
        {isRefetching ? (
          <ActivityIndicator color={colors.textSecondary} />
        ) : (
          <Text style={styles.buttonGhostText}>تحديث</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.xxl },
  balanceCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  balanceLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs },
  balance: { ...typography.title, fontSize: 34, color: "#fff" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: spacing.lg },
  tile: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  tileIcon: { fontSize: 20, marginBottom: spacing.xs },
  tileValue: { color: colors.textPrimary, fontSize: 17, fontWeight: "700" },
  tileLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: "center" },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  buttonSecondaryText: { color: colors.textPrimary, fontWeight: "700", fontSize: 15 },
  buttonGhost: { paddingVertical: spacing.md, alignItems: "center" },
  buttonGhostText: { color: colors.textSecondary, fontWeight: "600" },
});
