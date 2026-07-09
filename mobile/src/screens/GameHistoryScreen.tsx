import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import type { DiceGameRound } from "@/api/types";

export function GameHistoryScreen() {
  const { data: rounds, isLoading } = useQuery({
    queryKey: ["game-history"],
    queryFn: async () => (await apiClient.get<DiceGameRound[]>("/games/dice/history")).data,
  });

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
      {!isLoading && rounds?.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎲</Text>
          <Text style={styles.emptyText}>لا يوجد سجل ألعاب بعد</Text>
        </View>
      )}
      <FlatList
        data={rounds}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.diceIcon}>🎲</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>
                راهنت بـ {item.betAmount} 💰 على الرقم {item.choice}
              </Text>
              <Text style={styles.cardSubtitle}>الرقم الفائز: {item.rolledNumber}</Text>
            </View>
            <Text style={[styles.result, item.isWin ? styles.win : styles.lose]}>
              {item.isWin ? `+${item.payout}` : "خسارة"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 80, paddingHorizontal: spacing.xxl },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  diceIcon: { fontSize: 28 },
  cardBody: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end" },
  cardTitle: { color: colors.textPrimary, fontWeight: "700", fontSize: 14 },
  cardSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  result: { fontWeight: "800", fontSize: 14 },
  win: { color: colors.success },
  lose: { color: colors.danger },
});
