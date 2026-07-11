import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { apiClient } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { colors, radii, spacing } from "@/theme";
import type { GiftSend } from "@/api/types";

export function GiftHistoryScreen() {
  const { user } = useAuth();
  const { data: gifts, isLoading } = useQuery({
    queryKey: ["gift-history"],
    queryFn: async () => (await apiClient.get<GiftSend[]>("/gifts/history")).data,
  });

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
      {!isLoading && gifts?.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎁</Text>
          <Text style={styles.emptyText}>لا يوجد سجل هدايا بعد</Text>
        </View>
      )}
      <FlatList
        data={gifts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }) => {
          const isSender = item.senderId === user?.id;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.giftIcon}>{item.isLucky ? "🎰" : "🎁"}</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.gift.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    {isSender ? `أرسلتها إلى ${item.recipient.username}` : `من ${item.sender.username}`}
                  </Text>
                </View>
                <Text style={styles.amount}>
                  {isSender ? "-" : "+"}
                  {isSender ? item.totalGoldCost : item.diamondsAwarded} {isSender ? "💰" : "💎"}
                </Text>
              </View>
              {item.isLucky && item.luckyMultiplier != null && (
                <Text style={styles.luckyTag}>مضاعف الحظ: x{item.luckyMultiplier}</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 80, paddingHorizontal: spacing.xxl },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: "row-reverse", alignItems: "center" },
  giftIcon: { fontSize: 28 },
  cardBody: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end" },
  cardTitle: { color: colors.textPrimary, fontWeight: "700", fontSize: 15 },
  cardSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  amount: { color: colors.gold, fontWeight: "700" },
  luckyTag: { color: colors.textMuted, fontSize: 11, textAlign: "right", marginTop: spacing.sm },
});
