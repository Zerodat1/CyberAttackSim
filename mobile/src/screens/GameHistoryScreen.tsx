import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import type { GameRound, GameType } from "@/api/types";

const GAME_ICON: Record<GameType, string> = {
  DICE_GUESS: "🎲",
  LUCKY_WHEEL: "🎡",
  SLOT_MACHINE: "🎰",
  CRASH_GUESS: "🚀",
};

const GAME_LABEL: Record<GameType, string> = {
  DICE_GUESS: "تخمين الرقم",
  LUCKY_WHEEL: "عجلة الحظ",
  SLOT_MACHINE: "ماكينة الحظ",
  CRASH_GUESS: "الصاروخ",
};

function roundSubtitle(item: GameRound): string {
  switch (item.gameType) {
    case "DICE_GUESS":
      return `اخترت الرقم ${item.choice} — الرقم الفائز: ${item.rolledNumber}`;
    case "LUCKY_WHEEL":
    case "SLOT_MACHINE":
      return item.isWin ? `مضاعف الفوز: x${item.multiplier}` : "لم يحالفك الحظ";
    case "CRASH_GUESS":
      return `هدفك x${(item.choice / 100).toFixed(2)} — انفجر عند x${(item.rolledNumber / 100).toFixed(2)}`;
    default:
      return "";
  }
}

export function GameHistoryScreen() {
  const { data: rounds, isLoading } = useQuery({
    queryKey: ["game-history"],
    queryFn: async () => (await apiClient.get<GameRound[]>("/games/history")).data,
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
            <Text style={styles.gameIcon}>{GAME_ICON[item.gameType]}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>
                {GAME_LABEL[item.gameType]} — راهنت بـ {item.betAmount} 💰
              </Text>
              <Text style={styles.cardSubtitle}>{roundSubtitle(item)}</Text>
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
  gameIcon: { fontSize: 28 },
  cardBody: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end" },
  cardTitle: { color: colors.textPrimary, fontWeight: "700", fontSize: 14 },
  cardSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  result: { fontWeight: "800", fontSize: 14 },
  win: { color: colors.success },
  lose: { color: colors.danger },
});
