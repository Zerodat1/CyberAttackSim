import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { Avatar } from "@/components/Avatar";
import { colors, radii, spacing } from "@/theme";
import type { HostAgencyMembership, HostAgencySummary } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "HostAgencies">;

export function HostAgenciesScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: membership, isLoading: loadingMembership } = useQuery({
    queryKey: ["my-host-agency"],
    queryFn: async () => (await apiClient.get<HostAgencyMembership | null>("/host-agencies/me")).data,
  });

  const { data: agencies, isLoading: loadingAgencies } = useQuery({
    queryKey: ["host-agencies"],
    queryFn: async () => (await apiClient.get<HostAgencySummary[]>("/host-agencies")).data,
    enabled: !membership,
  });

  const createMutation = useMutation({
    mutationFn: async () => (await apiClient.post<HostAgencySummary>("/host-agencies", { name, description: description || undefined })).data,
    onSuccess: (agency) => {
      queryClient.invalidateQueries({ queryKey: ["my-host-agency"] });
      queryClient.invalidateQueries({ queryKey: ["host-agencies"] });
      setCreating(false);
      setName("");
      setDescription("");
      setError(null);
      navigation.navigate("HostAgencyDetail", { agencyId: agency.id });
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر إنشاء الوكالة"),
  });

  const joinMutation = useMutation({
    mutationFn: async (agencyId: string) => apiClient.post(`/host-agencies/${agencyId}/join`, {}),
    onSuccess: (_data, agencyId) => {
      queryClient.invalidateQueries({ queryKey: ["my-host-agency"] });
      queryClient.invalidateQueries({ queryKey: ["host-agencies"] });
      navigation.navigate("HostAgencyDetail", { agencyId });
    },
  });

  if (loadingMembership) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (membership) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.myAgencyCard}
          onPress={() => navigation.navigate("HostAgencyDetail", { agencyId: membership.agencyId })}
        >
          <LinearGradient colors={[colors.primary, "#8a3ffb"]} style={styles.myAgencyGradient}>
            <Text style={styles.myAgencyLabel}>وكالتي</Text>
            <Text style={styles.myAgencyName}>{membership.agency.name}</Text>
            <View style={styles.myAgencyMetaRow}>
              <Text style={styles.myAgencyMeta}>👥 {membership.agency._count.members} عضو</Text>
              <Text style={styles.myAgencyMeta}>{membership.role === "OWNER" ? "المالك" : "مضيف"}</Text>
            </View>
            <Text style={styles.myAgencyChevron}>عرض التفاصيل ‹</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>وكالات المضيفين</Text>
        <Text style={styles.headerSubtitle}>انضم إلى وكالة موجودة أو أنشئ وكالتك الخاصة</Text>
      </View>

      <TouchableOpacity style={styles.createButton} onPress={() => setCreating(true)}>
        <Text style={styles.createButtonText}>+ إنشاء وكالة مضيفين جديدة</Text>
      </TouchableOpacity>

      {loadingAgencies && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
      {!loadingAgencies && agencies?.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏢</Text>
          <Text style={styles.emptyText}>لا توجد وكالات بعد، كن أول من ينشئ واحدة!</Text>
        </View>
      )}

      <FlatList
        data={agencies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: spacing.lg }}
        renderItem={({ item }) => (
          <View style={styles.agencyCard}>
            <Avatar name={item.owner.fullName} imageUrl={item.owner.avatarUrl} size={44} />
            <View style={styles.agencyBody}>
              <Text style={styles.agencyName}>{item.name}</Text>
              <Text style={styles.agencySubtitle}>
                {item.owner.fullName} · 👥 {item._count.members}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.joinButton}
              disabled={joinMutation.isPending}
              onPress={() => joinMutation.mutate(item.id)}
            >
              <Text style={styles.joinButtonText}>انضمام</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={creating} transparent animationType="slide" onRequestClose={() => setCreating(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>إنشاء وكالة مضيفين</Text>
            <ScrollView>
              <Text style={styles.fieldLabel}>اسم الوكالة</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="مثال: وكالة النجوم" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>وصف الوكالة (اختياري)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="عرّف بوكالتك..."
                placeholderTextColor={colors.textMuted}
              />

              {error && <Text style={styles.error}>{error}</Text>}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, !name && styles.buttonDisabled]}
                disabled={!name || createMutation.isPending}
                onPress={() => createMutation.mutate()}
              >
                {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>إنشاء</Text>}
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
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  headerRow: { marginBottom: spacing.lg },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", textAlign: "right" },
  headerSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: "right" },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  createButtonText: { color: "#fff", fontWeight: "700" },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 60, paddingHorizontal: spacing.xxl },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  agencyCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  agencyBody: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end" },
  agencyName: { color: colors.textPrimary, fontSize: 15, fontWeight: "700", textAlign: "right" },
  agencySubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: "right" },
  joinButton: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  joinButtonText: { color: colors.primaryLight, fontWeight: "700", fontSize: 12 },
  myAgencyCard: { borderRadius: radii.xl, overflow: "hidden" },
  myAgencyGradient: { padding: spacing.xl },
  myAgencyLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12, textAlign: "right" },
  myAgencyName: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "right", marginTop: spacing.xs },
  myAgencyMetaRow: { flexDirection: "row-reverse", gap: spacing.md, marginTop: spacing.md },
  myAgencyMeta: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  myAgencyChevron: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: spacing.lg, textAlign: "right" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl, maxHeight: "80%" },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "700", textAlign: "right", marginBottom: spacing.lg },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, textAlign: "right", marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlign: "right",
  },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },
  modalActions: { flexDirection: "row-reverse", gap: spacing.md, marginTop: spacing.lg },
  button: { flex: 1, backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonSecondary: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: colors.danger, textAlign: "center", marginTop: spacing.sm },
});
