import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiClient } from "@/api/client";
import { colors, hexToRgba, radii, spacing, typography } from "@/theme";
import type { UserWallet, VipLevel, VipStatus } from "@/api/types";

export function VipScreen() {
  const queryClient = useQueryClient();

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await apiClient.get<UserWallet>("/wallet/me")).data,
  });

  const { data: levels, isLoading } = useQuery({
    queryKey: ["vip-levels"],
    queryFn: async () => (await apiClient.get<VipLevel[]>("/vip/levels")).data,
  });

  const { data: status } = useQuery({
    queryKey: ["vip-status"],
    queryFn: async () => (await apiClient.get<VipStatus>("/vip/me")).data,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (level: number) => apiClient.post(`/vip/levels/${level}/purchase`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vip-status"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  return (
    <View style={styles.screen}>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceText}>{wallet?.goldBalance ?? 0}</Text>
        <Text style={styles.balanceLabel}>ذهب 💰</Text>
      </View>

      {status?.isActive && status.current && (
        <View style={[styles.statusCard, { borderColor: status.current.badgeColor }]}>
          <Text style={styles.statusEmoji}>{status.current.frameEmoji}</Text>
          <Text style={[styles.statusText, { color: status.current.badgeColor }]}>
            أنت {status.current.name} حتى {new Date(status.vipExpiresAt!).toLocaleDateString("ar")}
          </Text>
        </View>
      )}

      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {levels?.map((level) => {
          const isCurrent = status?.isActive && status.vipLevel === level.level;
          return (
            <View key={level.level} style={[styles.card, { borderColor: hexToRgba(level.badgeColor, 0.5) }]}>
              <View style={[styles.badge, { backgroundColor: hexToRgba(level.badgeColor, 0.18) }]}>
                <Text style={styles.badgeEmoji}>{level.frameEmoji}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: level.badgeColor }]}>{level.name}</Text>
                <Text style={styles.cardSubtitle}>
                  إطار حصري + دخولية مميزة + شارة VIP لمدة {level.durationDays} يومًا
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.buyButton, isCurrent && styles.buyButtonCurrent, { backgroundColor: isCurrent ? colors.surfaceMuted : level.badgeColor }]}
                onPress={() => purchaseMutation.mutate(level.level)}
                disabled={purchaseMutation.isPending}
              >
                <Text style={styles.buyButtonText}>{isCurrent ? "تجديد" : `${level.priceGold} 💰`}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  balanceRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  balanceText: { color: colors.gold, fontWeight: "800", fontSize: 18 },
  balanceLabel: { color: colors.textSecondary, fontSize: 13 },
  statusCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  statusEmoji: { fontSize: 20 },
  statusText: { fontWeight: "700", fontSize: 13 },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  badge: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  badgeEmoji: { fontSize: 24 },
  cardBody: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end" },
  cardTitle: { ...typography.heading, textAlign: "right" },
  cardSubtitle: { color: colors.textSecondary, fontSize: 11, textAlign: "right", marginTop: 3, lineHeight: 16 },
  buyButton: { borderRadius: radii.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  buyButtonCurrent: { borderWidth: 1, borderColor: colors.textMuted },
  buyButtonText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
