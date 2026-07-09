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
import { Avatar } from "@/components/Avatar";
import { colors, radii, spacing } from "@/theme";
import type { RoomSummary } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "RoomsList">;

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
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Room", { roomId: item.id })}>
            <View style={styles.avatarWrap}>
              <Avatar name={item.owner.fullName} size={44} />
              {item.isPasswordProtected && (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockBadgeText}>🔒</Text>
                </View>
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.owner.fullName}</Text>
            </View>
            <View style={styles.memberPill}>
              <Text style={styles.memberPillText}>👥 {item._count.members}</Text>
            </View>
          </TouchableOpacity>
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
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardBody: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end" },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", textAlign: "right" },
  cardSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: "right" },
  avatarWrap: { position: "relative" },
  lockBadge: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  lockBadgeText: { fontSize: 9 },
  memberPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  memberPillText: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
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
