import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { colorForName, colors, hexToRgba, radii, spacing, typography } from "@/theme";
import type { RoomSummary } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "RoomsList">;

function RoomCard({ room, onPress }: { room: RoomSummary; onPress: () => void }) {
  const accent = colorForName(room.name);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.thumb, { backgroundColor: hexToRgba(accent, 0.22) }]}>
        <View style={styles.liveRibbon}>
          <Text style={styles.liveRibbonText}>مباشر</Text>
        </View>
        <Text style={styles.thumbIcon}>🎙️</Text>
        <View style={styles.membersOverlay}>
          <Text style={styles.membersOverlayText}>👥 {room._count.members}</Text>
        </View>
        {room.isPasswordProtected && (
          <View style={styles.lockBadge}>
            <Text style={styles.lockBadgeText}>🔒</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {room.name}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          👑 {room.owner.fullName}
        </Text>
        <View style={styles.tagsRow}>
          <View style={[styles.tag, { backgroundColor: hexToRgba(accent, 0.18) }]}>
            <Text style={[styles.tagText, { color: accent }]}>🎧 {room.seatCount} مقعد</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagTextMuted}>{room.isPasswordProtected ? "خاصة" : "عامة"}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function RoomsListScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => (await apiClient.get<RoomSummary[]>("/rooms")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => (await apiClient.post("/rooms", { name: newRoomName })).data,
    onSuccess: (room: RoomSummary) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setCreating(false);
      setNewRoomName("");
      navigation.navigate("Room", { roomId: room.id });
    },
  });

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
      {!isLoading && rooms?.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎙️</Text>
          <Text style={styles.emptyText}>لا توجد غرف نشطة الآن، أنشئ أول غرفة!</Text>
        </View>
      )}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <RoomCard room={item} onPress={() => navigation.navigate("Room", { roomId: item.id })} />
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setCreating(true)}>
        <Text style={styles.fabText}>+ غرفة جديدة</Text>
      </TouchableOpacity>

      <Modal visible={creating} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>إنشاء غرفة صوتية</Text>
            <TextInput
              style={styles.input}
              placeholder="اسم الغرفة"
              placeholderTextColor={colors.textMuted}
              value={newRoomName}
              onChangeText={setNewRoomName}
            />
            <View style={{ flexDirection: "row-reverse", gap: spacing.md }}>
              <TouchableOpacity
                style={[styles.button, !newRoomName && styles.buttonDisabled]}
                disabled={!newRoomName}
                onPress={() => createMutation.mutate()}
              >
                <Text style={styles.buttonText}>إنشاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => setCreating(false)}>
                <Text style={styles.buttonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  thumb: {
    width: 78,
    height: 78,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbIcon: { fontSize: 30 },
  liveRibbon: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: colors.giftPink,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveRibbonText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  membersOverlay: {
    position: "absolute",
    bottom: 5,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  membersOverlayText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  lockBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  lockBadgeText: { fontSize: 10 },
  cardBody: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end", justifyContent: "center" },
  cardTitle: { ...typography.heading, color: colors.textPrimary, textAlign: "right" },
  cardSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 3, textAlign: "right" },
  tagsRow: { flexDirection: "row-reverse", gap: spacing.xs, marginTop: spacing.sm },
  tag: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: { fontSize: 11, fontWeight: "700" },
  tagTextMuted: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { color: "#fff", fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: spacing.xxl },
  modalCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "700", textAlign: "right", marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    marginBottom: spacing.lg,
    textAlign: "right",
  },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  buttonSecondary: { backgroundColor: colors.surfaceMuted, borderRadius: radii.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
