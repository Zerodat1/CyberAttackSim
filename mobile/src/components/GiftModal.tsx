import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "@/components/Avatar";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import type { Gift, GiftType, RoomMember } from "@/api/types";

interface Props {
  visible: boolean;
  roomId: string;
  members: RoomMember[];
  currentUserId?: string;
  onClose: () => void;
}

const TABS: { key: GiftType; label: string }[] = [
  { key: "STATIC", label: "الهدايا" },
  { key: "LUCKY", label: "الحظ" },
];

const TYPE_FALLBACK_ICON: Record<GiftType, string> = {
  STATIC: "🎁",
  LUCKY: "🎰",
};

export function GiftModal({ visible, roomId, members, currentUserId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<GiftType>("STATIC");
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [giftId, setGiftId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: gifts, isLoading } = useQuery({
    queryKey: ["gifts-catalog"],
    queryFn: async () => (await apiClient.get<Gift[]>("/gifts")).data,
    enabled: visible,
  });

  const sendMutation = useMutation({
    mutationFn: async () =>
      apiClient.post("/gifts/send", {
        recipientId,
        giftId,
        quantity,
        roomId,
      }),
    onSuccess: () => {
      setSuccess("تم إرسال الهدية بنجاح");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? "تعذر إرسال الهدية");
      setSuccess(null);
    },
  });

  const otherMembers = members.filter((m) => m.userId !== currentUserId);
  const visibleGifts = useMemo(() => gifts?.filter((g) => g.type === activeTab) ?? [], [gifts, activeTab]);
  const selectedGift = gifts?.find((g) => g.id === giftId);

  function selectTab(tab: GiftType) {
    setActiveTab(tab);
    setGiftId(null);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>إرسال هدية</Text>
            <View style={{ width: 20 }} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipientRow}>
            {otherMembers.map((member) => (
              <TouchableOpacity
                key={member.userId}
                style={styles.recipientChip}
                onPress={() => setRecipientId(member.userId)}
              >
                <View style={[styles.recipientAvatarRing, recipientId === member.userId && styles.recipientAvatarRingActive]}>
                  <Avatar name={member.user.username} imageUrl={member.user.avatarUrl} size={44} />
                </View>
                <Text style={styles.recipientName} numberOfLines={1}>
                  {member.user.username}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.tabsRow}>
            {TABS.map((tab) => (
              <TouchableOpacity key={tab.key} style={styles.tabButton} onPress={() => selectTab(tab.key)}>
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
                {activeTab === tab.key && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          {isLoading && <ActivityIndicator color={colors.giftPink} style={{ marginVertical: spacing.lg }} />}

          <ScrollView contentContainerStyle={styles.grid}>
            {visibleGifts.map((gift) => (
              <TouchableOpacity
                key={gift.id}
                style={[styles.giftCard, giftId === gift.id && styles.giftCardActive]}
                onPress={() => setGiftId(gift.id)}
              >
                {gift.iconUrl ? (
                  <Image source={{ uri: gift.iconUrl }} style={styles.giftIconImage} />
                ) : (
                  <Text style={styles.giftIconEmoji}>{TYPE_FALLBACK_ICON[gift.type]}</Text>
                )}
                <Text style={styles.giftName} numberOfLines={1}>
                  {gift.name}
                </Text>
                <View style={styles.giftPriceRow}>
                  <Text style={styles.giftPriceCoin}>🪙</Text>
                  <Text style={styles.giftPriceText}>{gift.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {!isLoading && visibleGifts.length === 0 && <Text style={styles.emptyText}>لا توجد هدايا في هذا القسم</Text>}
          </ScrollView>

          {error && <Text style={styles.error}>{error}</Text>}
          {success && <Text style={styles.success}>{success}</Text>}

          <View style={styles.bottomBar}>
            <View style={styles.quantityStepper}>
              <TouchableOpacity style={styles.stepperButton} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Text style={styles.stepperButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <TouchableOpacity style={styles.stepperButton} onPress={() => setQuantity((q) => q + 1)}>
                <Text style={styles.stepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, (!recipientId || !giftId) && styles.sendButtonDisabled]}
              disabled={!recipientId || !giftId || sendMutation.isPending}
              onPress={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>
                  إهداء {selectedGift ? `(${Number(selectedGift.price) * quantity} 🪙)` : ""}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: "82%",
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  closeIcon: { color: colors.textMuted, fontSize: 16 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  recipientRow: { flexGrow: 0, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  recipientChip: { alignItems: "center", marginEnd: spacing.md, width: 56 },
  recipientAvatarRing: {
    padding: 2,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "transparent",
  },
  recipientAvatarRingActive: { borderColor: colors.giftPink },
  recipientName: { color: colors.textSecondary, fontSize: 10, marginTop: 4, maxWidth: 56, textAlign: "center" },
  tabsRow: {
    flexDirection: "row-reverse",
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    marginBottom: spacing.md,
  },
  tabButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  tabLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "700" },
  tabLabelActive: { color: colors.giftPink },
  tabIndicator: { height: 3, width: "100%", backgroundColor: colors.giftPink, borderRadius: 2, marginTop: 6 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  giftCard: {
    width: "30%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  giftCardActive: { borderColor: colors.giftPink, backgroundColor: "rgba(255,61,154,0.12)" },
  giftIconImage: { width: 44, height: 44, marginBottom: spacing.xs },
  giftIconEmoji: { fontSize: 34, marginBottom: spacing.xs },
  giftName: { color: colors.textPrimary, fontSize: 12, fontWeight: "700", maxWidth: "100%" },
  giftPriceRow: { flexDirection: "row-reverse", alignItems: "center", marginTop: 4, gap: 4 },
  giftPriceCoin: { fontSize: 11 },
  giftPriceText: { color: colors.gold, fontSize: 12, fontWeight: "700" },
  emptyText: { color: colors.textMuted, textAlign: "center", width: "100%", paddingVertical: spacing.xl },
  error: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm, paddingHorizontal: spacing.xl },
  success: { color: colors.success, textAlign: "center", marginBottom: spacing.sm, paddingHorizontal: spacing.xl },
  bottomBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  quantityStepper: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
  },
  stepperButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  stepperButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  stepperValue: { color: "#fff", fontWeight: "700", minWidth: 24, textAlign: "center" },
  sendButton: { flex: 1, borderRadius: radii.pill, paddingVertical: 14, alignItems: "center", backgroundColor: colors.giftPink },
  sendButtonDisabled: { backgroundColor: colors.surfaceMuted },
  sendButtonText: { color: "#fff", fontWeight: "800" },
});
