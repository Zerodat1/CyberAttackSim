import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import type { AgentDashboard } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "AgentDashboard">;

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export function AgentDashboardScreen({ navigation }: Props) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["agent-dashboard"],
    queryFn: async () => (await apiClient.get<AgentDashboard>("/recharge-agency/dashboard")).data,
  });

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#5b4cf5" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.balance}>{data.availableBalance.toFixed(2)}$</Text>
      <Text style={styles.balanceLabel}>الرصيد المتاح للشحن</Text>

      <View style={styles.grid}>
        <StatTile label="شحن اليوم" value={`${data.dailyChargeTotal}$`} />
        <StatTile label="شحن الأسبوع" value={`${data.weeklyChargeTotal}$`} />
        <StatTile label="شحن الشهر" value={`${data.monthlyChargeTotal}$`} />
        <StatTile label="عدد العملاء" value={data.totalCustomers} />
        <StatTile label="عدد العمليات" value={data.totalTransactions} />
        <StatTile label="إجمالي العمولات" value={`${data.totalCommissionEarned}$`} />
        <StatTile label="الرصيد المجمد" value={`${data.frozenBalance}$`} />
        <StatTile label="طلبات سحب معلقة" value={`${data.pendingWithdrawals}$`} />
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ChargeUser")}>
        <Text style={styles.buttonText}>شحن مستخدم</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate("WithdrawalRequest")}>
        <Text style={styles.buttonText}>طلب سحب أرباح</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => refetch()}>
        <Text style={styles.buttonText}>تحديث</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: "#0f1020" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f1020" },
  balance: { fontSize: 40, fontWeight: "800", color: "#fff", textAlign: "center" },
  balanceLabel: { color: "#aab0d8", textAlign: "center", marginBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 24 },
  tile: {
    width: "48%",
    backgroundColor: "#1c1e3a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  tileValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  tileLabel: { color: "#aab0d8", fontSize: 12, marginTop: 4 },
  button: { backgroundColor: "#5b4cf5", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 12 },
  buttonSecondary: {
    backgroundColor: "#1c1e3a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
