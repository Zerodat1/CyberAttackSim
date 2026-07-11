import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiClient } from "@/api/client";
import { colors, hexToRgba, radii, spacing } from "@/theme";
import type { StoreInventory, StoreItem, StoreItemCategory, UserWallet } from "@/api/types";

const TABS: { key: StoreItemCategory; label: string; icon: string }[] = [
  { key: "FRAME", label: "الإطارات", icon: "🖼️" },
  { key: "ENTRANCE", label: "الدخوليات", icon: "🚪" },
  { key: "BUBBLE", label: "الفقاعات", icon: "💬" },
  { key: "MIC_EFFECT", label: "تأثيرات المايك", icon: "🎙️" },
];

const EQUIP_FIELD: Record<StoreItemCategory, keyof StoreInventory["equipped"]> = {
  FRAME: "activeFrameId",
  ENTRANCE: "activeEntranceId",
  BUBBLE: "activeBubbleId",
  MIC_EFFECT: "activeMicEffectId",
};

export function StoreScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<StoreItemCategory>("FRAME");

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await apiClient.get<UserWallet>("/wallet/me")).data,
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["store-items", activeTab],
    queryFn: async () =>
      (await apiClient.get<StoreItem[]>("/store/items", { params: { category: activeTab } })).data,
  });

  const { data: inventory } = useQuery({
    queryKey: ["store-inventory"],
    queryFn: async () => (await apiClient.get<StoreInventory>("/store/me")).data,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (itemId: string) => apiClient.post(`/store/items/${itemId}/purchase`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-items"] });
      queryClient.invalidateQueries({ queryKey: ["store-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  const equipMutation = useMutation({
    mutationFn: async ({ category, storeItemId }: { category: StoreItemCategory; storeItemId: string | null }) =>
      apiClient.post("/store/equip", { category, storeItemId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["store-inventory"] }),
  });

  const equippedId = inventory ? inventory.equipped[EQUIP_FIELD[activeTab]] : null;

  return (
    <View style={styles.screen}>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceText}>{wallet?.goldBalance ?? 0}</Text>
        <Text style={styles.balanceLabel}>ذهب 💰</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={{ gap: spacing.sm }}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}

      <ScrollView contentContainerStyle={styles.grid}>
        {items?.map((item) => {
          const isEquipped = equippedId === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <View style={[styles.preview, { backgroundColor: hexToRgba(item.colorHex, 0.2), borderColor: item.colorHex }]}>
                <Text style={styles.previewEmoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.owned ? (
                <>
                  {item.expiresAt && (
                    <Text style={styles.expiryText}>
                      حتى {new Date(item.expiresAt).toLocaleDateString("ar")}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, isEquipped ? styles.actionButtonEquipped : styles.actionButtonEquip]}
                    onPress={() =>
                      equipMutation.mutate({ category: activeTab, storeItemId: isEquipped ? null : item.id })
                    }
                  >
                    <Text style={styles.actionButtonText}>{isEquipped ? "مفعّل ✓" : "تفعيل"}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonBuy]}
                  onPress={() => purchaseMutation.mutate(item.id)}
                  disabled={purchaseMutation.isPending}
                >
                  <Text style={styles.actionButtonText}>{item.priceGold} 💰</Text>
                </TouchableOpacity>
              )}
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
  tabsRow: { flexGrow: 0, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  tab: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tabActive: { backgroundColor: colors.primary },
  tabIcon: { fontSize: 14 },
  tabLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  tabLabelActive: { color: "#fff" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: "center",
  },
  preview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  previewEmoji: { fontSize: 28 },
  itemName: { color: colors.textPrimary, fontWeight: "700", fontSize: 13, marginBottom: spacing.sm },
  expiryText: { color: colors.textMuted, fontSize: 10, marginBottom: spacing.xs },
  actionButton: { borderRadius: radii.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.xs },
  actionButtonBuy: { backgroundColor: colors.primary },
  actionButtonEquip: { backgroundColor: colors.surfaceMuted },
  actionButtonEquipped: { backgroundColor: colors.success },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
