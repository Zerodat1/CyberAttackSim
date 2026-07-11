import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { apiClient } from "@/api/client";
import { Avatar } from "@/components/Avatar";
import { colors, radii, spacing, typography } from "@/theme";
import { uploadImageDataUri } from "@/utils/uploadImage";
import type { HostAgentWithdrawalRequest, HostAgentWithdrawalStatus } from "@/api/types";

const STATUS_LABEL: Record<HostAgentWithdrawalStatus, string> = {
  PENDING: "بانتظار قرارك",
  ACCEPTED: "بانتظار تحويل المبلغ",
  PAID: "بانتظار تأكيد المضيف",
  COMPLETED: "مكتملة",
  REJECTED: "مرفوضة",
  CANCELLED: "ألغاها المضيف",
  REFUNDED: "أُرجعت للمضيف تلقائيًا",
};

const STATUS_COLOR: Record<HostAgentWithdrawalStatus, string> = {
  PENDING: colors.gold,
  ACCEPTED: colors.primary,
  PAID: colors.giftPink,
  COMPLETED: colors.success,
  REJECTED: colors.danger,
  CANCELLED: colors.textMuted,
  REFUNDED: colors.textMuted,
};

function InboxCard({ request }: { request: HostAgentWithdrawalRequest }) {
  const queryClient = useQueryClient();
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["agent-cashout-inbox"] });

  const acceptMutation = useMutation({
    mutationFn: async () => apiClient.post(`/agent-cashout/agent/requests/${request.id}/accept`),
    onSuccess: invalidate,
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر قبول الطلب"),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => apiClient.post(`/agent-cashout/agent/requests/${request.id}/reject`, {}),
    onSuccess: invalidate,
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر رفض الطلب"),
  });

  const payMutation = useMutation({
    mutationFn: async () =>
      apiClient.post(`/agent-cashout/agent/requests/${request.id}/pay`, {
        proofUrl,
        paymentReference: reference || undefined,
      }),
    onSuccess: invalidate,
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر إرسال إثبات الدفع"),
  });

  async function pickProofImage() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("يجب السماح بالوصول إلى الصور لرفع الإيصال");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;

    setUploading(true);
    try {
      const mime = asset.mimeType ?? "image/jpeg";
      const url = await uploadImageDataUri(`data:${mime};base64,${asset.base64}`, "withdrawal-proofs");
      setProofUrl(url);
    } catch {
      setError("تعذر رفع الصورة، حاول مجددًا");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[request.status] }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABEL[request.status]}</Text>
        </View>
        <View style={styles.hostRow}>
          <Text style={styles.cardHostName}>{request.host?.username ?? "مضيف"}</Text>
          <Avatar name={request.host?.username ?? "?"} imageUrl={request.host?.avatarUrl} size={32} />
        </View>
      </View>

      <View style={styles.amountsRow}>
        <Text style={styles.amountText}>{request.diamondsAmount} 💎</Text>
        <Text style={styles.amountSub}>≈ {request.usdAmount}$</Text>
      </View>

      <Text style={styles.detailText}>حوّل إلى: {request.payoutMethod} — {request.payoutAccount}</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {request.status === "PENDING" && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryButton, { flex: 1 }]}
            disabled={acceptMutation.isPending}
            onPress={() => acceptMutation.mutate()}
          >
            {acceptMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>قبول</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { flex: 1 }]}
            disabled={rejectMutation.isPending}
            onPress={() =>
              Alert.alert("رفض الطلب", "سيتم إرجاع الألماس إلى المضيف فورًا.", [
                { text: "تراجع", style: "cancel" },
                { text: "تأكيد الرفض", onPress: () => rejectMutation.mutate() },
              ])
            }
          >
            {rejectMutation.isPending ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.secondaryButtonText}>رفض</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {request.status === "ACCEPTED" && (
        <View style={styles.payBox}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickProofImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : proofUrl ? (
              <Image source={{ uri: proofUrl }} style={styles.proofImage} />
            ) : (
              <Text style={styles.uploadButtonText}>+ رفع صورة الإيصال</Text>
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={reference}
            onChangeText={setReference}
            placeholder="رقم العملية (اختياري)"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.primaryButton, !proofUrl && styles.buttonDisabled]}
            disabled={!proofUrl || payMutation.isPending}
            onPress={() => payMutation.mutate()}
          >
            {payMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>تم التحويل، إرسال الإثبات</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {request.status === "PAID" && request.proofUrl && (
        <Image source={{ uri: request.proofUrl }} style={styles.proofImage} />
      )}
    </View>
  );
}

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "الكل" },
  { key: "PENDING", label: "جديدة" },
  { key: "ACCEPTED", label: "قيد التحويل" },
  { key: "PAID", label: "بانتظار التأكيد" },
];

export function AgentCashoutInboxScreen() {
  const [filter, setFilter] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["agent-cashout-inbox", filter],
    queryFn: async () =>
      (
        await apiClient.get<HostAgentWithdrawalRequest[]>("/agent-cashout/agent/requests", {
          params: filter ? { status: filter } : undefined,
        })
      ).data,
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.xxl, paddingBottom: spacing.xxl }}>
      <Text style={styles.subtitle}>طلبات سحب الألماس المرسلة إليك من المضيفين</Text>

      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />}
      {!isLoading && (requests ?? []).length === 0 && <Text style={styles.emptyText}>لا توجد طلبات</Text>}
      {requests?.map((request) => (
        <InboxCard key={request.id} request={request} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: "right", marginBottom: spacing.lg, lineHeight: 20 },
  filtersRow: { flexDirection: "row-reverse", gap: spacing.sm, marginBottom: spacing.lg },
  filterChip: { backgroundColor: colors.surfaceAlt, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: "#fff" },
  emptyText: { color: colors.textMuted, textAlign: "center", paddingVertical: spacing.xl },
  card: { backgroundColor: colors.surfaceAlt, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  cardHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  hostRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.xs },
  cardHostName: { color: colors.textPrimary, fontWeight: "700" },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusBadgeText: { color: "#0f1020", fontSize: 11, fontWeight: "800" },
  amountsRow: { flexDirection: "row-reverse", alignItems: "baseline", gap: spacing.sm, marginBottom: spacing.xs },
  amountText: { color: colors.diamond, fontSize: 18, fontWeight: "800" },
  amountSub: { color: colors.textSecondary, fontSize: 12 },
  detailText: { color: colors.textSecondary, textAlign: "right", fontSize: 12, marginBottom: spacing.sm },
  errorText: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm, fontSize: 13 },
  actionsRow: { flexDirection: "row", gap: spacing.md },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 13, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  secondaryButton: { backgroundColor: colors.surfaceMuted, borderRadius: radii.md, paddingVertical: 13, alignItems: "center" },
  secondaryButtonText: { color: colors.textPrimary, fontWeight: "700", fontSize: 13 },
  buttonDisabled: { opacity: 0.5 },
  payBox: { marginTop: spacing.sm, gap: spacing.sm },
  uploadButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadButtonText: { color: colors.textSecondary, fontWeight: "700" },
  proofImage: { width: "100%", height: 160, borderRadius: radii.md },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlign: "right",
  },
});
