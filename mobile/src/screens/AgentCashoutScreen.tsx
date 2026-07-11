import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiClient } from "@/api/client";
import { Avatar } from "@/components/Avatar";
import { FormField } from "@/components/FormField";
import { colors, radii, spacing, typography } from "@/theme";
import type { AvailableCashoutAgent, HostAgentWithdrawalRequest, HostAgentWithdrawalStatus } from "@/api/types";

const STATUS_LABEL: Record<HostAgentWithdrawalStatus, string> = {
  PENDING: "بانتظار موافقة الوكيل",
  ACCEPTED: "قبل الوكيل، بانتظار التحويل",
  PAID: "حوّل الوكيل المبلغ، أكّد الاستلام",
  COMPLETED: "تمت العملية بنجاح",
  REJECTED: "رفض الوكيل الطلب",
  CANCELLED: "تم إلغاء الطلب",
  REFUNDED: "تم إرجاع الألماس تلقائيًا",
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

function RequestCard({ request }: { request: HostAgentWithdrawalRequest }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["agent-cashout-mine"] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
  };

  const cancelMutation = useMutation({
    mutationFn: async () => apiClient.post(`/agent-cashout/requests/${request.id}/cancel`),
    onSuccess: invalidate,
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر إلغاء الطلب"),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => apiClient.post(`/agent-cashout/requests/${request.id}/confirm`),
    onSuccess: invalidate,
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر تأكيد الاستلام"),
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[request.status] }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABEL[request.status]}</Text>
        </View>
        <Text style={styles.cardAgentName}>{request.rechargeAgent?.user.username ?? "وكيل"}</Text>
      </View>

      <View style={styles.amountsRow}>
        <Text style={styles.amountText}>{request.diamondsAmount} 💎</Text>
        <Text style={styles.amountSub}>≈ {request.usdAmount}$</Text>
      </View>

      <Text style={styles.detailText}>الدفع إلى: {request.payoutMethod} — {request.payoutAccount}</Text>

      {request.status === "PAID" && (
        <View style={styles.proofBox}>
          {request.proofUrl && <Image source={{ uri: request.proofUrl }} style={styles.proofImage} />}
          {request.paymentReference && (
            <Text style={styles.detailText}>رقم العملية: {request.paymentReference}</Text>
          )}
        </View>
      )}

      {request.rejectionReason && <Text style={styles.rejectionText}>{request.rejectionReason}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {request.status === "PENDING" && (
        <TouchableOpacity
          style={styles.secondaryButton}
          disabled={cancelMutation.isPending}
          onPress={() => cancelMutation.mutate()}
        >
          {cancelMutation.isPending ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.secondaryButtonText}>إلغاء الطلب</Text>
          )}
        </TouchableOpacity>
      )}

      {request.status === "PAID" && (
        <TouchableOpacity
          style={styles.primaryButton}
          disabled={confirmMutation.isPending}
          onPress={() =>
            Alert.alert("تأكيد الاستلام", "هل استلمت المبلغ بالفعل؟ لا يمكن التراجع بعد التأكيد.", [
              { text: "إلغاء", style: "cancel" },
              { text: "تم الاستلام", onPress: () => confirmMutation.mutate() },
            ])
          }
        >
          {confirmMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>تم الاستلام</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export function AgentCashoutScreen() {
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [diamondsAmount, setDiamondsAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ["agent-cashout-agents"],
    queryFn: async () => (await apiClient.get<AvailableCashoutAgent[]>("/agent-cashout/agents")).data,
  });

  const { data: myRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["agent-cashout-mine"],
    queryFn: async () => (await apiClient.get<HostAgentWithdrawalRequest[]>("/agent-cashout/requests/mine")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      apiClient.post("/agent-cashout/requests", {
        rechargeAgentId: selectedAgentId,
        diamondsAmount: Number(diamondsAmount),
        payoutMethod,
        payoutAccount,
      }),
    onSuccess: () => {
      setSuccess("تم إرسال طلب السحب، بانتظار موافقة الوكيل");
      setError(null);
      setSelectedAgentId(null);
      setDiamondsAmount("");
      setPayoutMethod("");
      setPayoutAccount("");
      queryClient.invalidateQueries({ queryKey: ["agent-cashout-mine"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? "تعذر إرسال طلب السحب");
      setSuccess(null);
    },
  });

  const canSubmit = selectedAgentId && diamondsAmount && payoutMethod && payoutAccount;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <Text style={styles.subtitle}>
        اسحب ألماسك مباشرة عبر أحد وكلاء الشحن دون الحاجة لموافقة الإدارة. يُجمّد الألماس فور إرسال الطلب حتى تُكمل
        العملية.
      </Text>

      <Text style={styles.sectionTitle}>اختر وكيل الشحن</Text>
      {agentsLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
      <View style={styles.agentsRow}>
        {agents?.map((agent) => {
          const active = selectedAgentId === agent.id;
          return (
            <TouchableOpacity
              key={agent.id}
              style={[styles.agentCard, active && styles.agentCardActive]}
              onPress={() => setSelectedAgentId(agent.id)}
            >
              <Avatar name={agent.user.username} imageUrl={agent.user.avatarUrl} size={44} />
              <Text style={styles.agentName} numberOfLines={1}>
                {agent.user.username}
              </Text>
              <Text style={styles.agentAgency} numberOfLines={1}>
                {agent.agencyName}
              </Text>
            </TouchableOpacity>
          );
        })}
        {!agentsLoading && (agents ?? []).length === 0 && (
          <Text style={styles.emptyText}>لا يوجد وكلاء شحن متاحون حاليًا</Text>
        )}
      </View>

      <View style={styles.card}>
        <FormField
          label="عدد الماسات"
          placeholder="0"
          value={diamondsAmount}
          onChangeText={setDiamondsAmount}
          keyboardType="numeric"
        />
        <FormField
          label="طريقة الاستلام"
          placeholder="تحويل بنكي، زين كاش، USDT..."
          value={payoutMethod}
          onChangeText={setPayoutMethod}
        />
        <FormField
          label="رقم الحساب / المحفظة"
          placeholder="أين تريد استلام المبلغ"
          value={payoutAccount}
          onChangeText={setPayoutAccount}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {success && <Text style={styles.successText}>{success}</Text>}

      <TouchableOpacity
        style={[styles.primaryButton, (!canSubmit || createMutation.isPending) && styles.buttonDisabled]}
        disabled={!canSubmit || createMutation.isPending}
        onPress={() => createMutation.mutate()}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>سحب</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>طلباتي</Text>
      {requestsLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
      {!requestsLoading && (myRequests ?? []).length === 0 && (
        <Text style={styles.emptyText}>لا توجد طلبات سحب بعد</Text>
      )}
      {myRequests?.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xxl },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: "right", marginBottom: spacing.lg, lineHeight: 20 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  agentsRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md },
  agentCard: {
    width: 90,
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  agentCardActive: { borderColor: colors.primary },
  agentName: { color: colors.textPrimary, fontSize: 12, fontWeight: "700", marginTop: spacing.xs, maxWidth: 80 },
  agentAgency: { color: colors.textMuted, fontSize: 10, maxWidth: 80 },
  card: { backgroundColor: colors.surfaceAlt, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  errorText: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm, fontSize: 13 },
  successText: { color: colors.success, textAlign: "center", marginBottom: spacing.sm, fontSize: 13 },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 15, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  buttonDisabled: { opacity: 0.5 },
  secondaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  secondaryButtonText: { color: colors.textPrimary, fontWeight: "700" },
  emptyText: { color: colors.textMuted, textAlign: "center", paddingVertical: spacing.lg },
  cardHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  cardAgentName: { color: colors.textPrimary, fontWeight: "700" },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusBadgeText: { color: "#0f1020", fontSize: 11, fontWeight: "800" },
  amountsRow: { flexDirection: "row-reverse", alignItems: "baseline", gap: spacing.sm, marginBottom: spacing.xs },
  amountText: { color: colors.diamond, fontSize: 18, fontWeight: "800" },
  amountSub: { color: colors.textSecondary, fontSize: 12 },
  detailText: { color: colors.textSecondary, textAlign: "right", fontSize: 12, marginBottom: spacing.xs },
  rejectionText: { color: colors.danger, textAlign: "right", fontSize: 12, marginBottom: spacing.xs },
  proofBox: { marginVertical: spacing.sm },
  proofImage: { width: "100%", height: 160, borderRadius: radii.md, marginBottom: spacing.xs },
});
