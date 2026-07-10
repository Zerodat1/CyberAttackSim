import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Avatar } from "@/components/Avatar";
import { colors, radii, spacing } from "@/theme";
import type { AgencyEarningsDashboard, HostAgencyDetail, HostDashboard, HostTargetTier } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "HostAgencyDetail">;

const WITHDRAWAL_STATUS_LABEL: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبولة",
  COMPLETED: "مكتملة",
  REJECTED: "مرفوضة",
};

export function HostAgencyDetailScreen({ route, navigation }: Props) {
  const { agencyId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [agencyWithdrawing, setAgencyWithdrawing] = useState(false);
  const [agencyWithdrawAmount, setAgencyWithdrawAmount] = useState("");
  const [agencyWithdrawMethod, setAgencyWithdrawMethod] = useState("");
  const [agencyWithdrawAccount, setAgencyWithdrawAccount] = useState("");
  const [agencyWithdrawError, setAgencyWithdrawError] = useState<string | null>(null);

  const { data: agency, isLoading } = useQuery({
    queryKey: ["host-agency-detail", agencyId],
    queryFn: async () => (await apiClient.get<HostAgencyDetail>(`/host-agencies/${agencyId}`)).data,
  });

  const isOwner = agency?.owner.id === user?.id;

  const { data: agencyDashboard } = useQuery({
    queryKey: ["agency-dashboard", agencyId],
    queryFn: async () =>
      (await apiClient.get<AgencyEarningsDashboard>(`/host-agencies/${agencyId}/dashboard`)).data,
    enabled: isOwner,
  });

  const { data: dashboard } = useQuery({
    queryKey: ["host-dashboard"],
    queryFn: async () => (await apiClient.get<HostDashboard>("/host-agencies/me/dashboard")).data,
  });

  const { data: tiers } = useQuery({
    queryKey: ["host-target-tiers"],
    queryFn: async () => (await apiClient.get<HostTargetTier[]>("/host-agencies/target-tiers")).data,
  });

  useEffect(() => {
    if (agency) {
      setName(agency.name);
      setDescription(agency.description ?? "");
    }
  }, [agency]);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["host-agency-detail", agencyId] });
    queryClient.invalidateQueries({ queryKey: ["my-host-agency"] });
    queryClient.invalidateQueries({ queryKey: ["host-agencies"] });
  }

  const updateMutation = useMutation({
    mutationFn: async () => apiClient.patch(`/host-agencies/${agencyId}`, { name, description: description || undefined }),
    onSuccess: () => {
      invalidateAll();
      setEditing(false);
      setError(null);
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر حفظ التعديلات"),
  });

  const kickMutation = useMutation({
    mutationFn: async (targetUserId: string) => apiClient.post(`/host-agencies/${agencyId}/members/${targetUserId}/kick`, {}),
    onSuccess: invalidateAll,
  });

  const leaveMutation = useMutation({
    mutationFn: async () => apiClient.post("/host-agencies/leave", {}),
    onSuccess: () => {
      invalidateAll();
      navigation.navigate("HostAgencies");
    },
  });

  const dissolveMutation = useMutation({
    mutationFn: async () => apiClient.delete(`/host-agencies/${agencyId}`),
    onSuccess: () => {
      invalidateAll();
      navigation.navigate("HostAgencies");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () =>
      apiClient.post("/host-agencies/withdrawals", {
        diamondsAmount: Number(withdrawAmount),
        method: withdrawMethod,
        accountNumber: withdrawAccount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-dashboard"] });
      setWithdrawing(false);
      setWithdrawAmount("");
      setWithdrawMethod("");
      setWithdrawAccount("");
      setWithdrawError(null);
    },
    onError: (err: any) => setWithdrawError(err?.response?.data?.message ?? "تعذر إرسال طلب الفك"),
  });

  const agencyWithdrawMutation = useMutation({
    mutationFn: async () =>
      apiClient.post(`/host-agencies/${agencyId}/withdrawals`, {
        usdAmount: Number(agencyWithdrawAmount),
        method: agencyWithdrawMethod,
        accountNumber: agencyWithdrawAccount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-dashboard", agencyId] });
      setAgencyWithdrawing(false);
      setAgencyWithdrawAmount("");
      setAgencyWithdrawMethod("");
      setAgencyWithdrawAccount("");
      setAgencyWithdrawError(null);
    },
    onError: (err: any) => setAgencyWithdrawError(err?.response?.data?.message ?? "تعذر إرسال طلب السحب"),
  });

  if (isLoading || !agency) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <LinearGradient colors={[colors.primary, "#8a3ffb"]} style={styles.header}>
        <Text style={styles.agencyName}>{agency.name}</Text>
        {agency.description && <Text style={styles.agencyDescription}>{agency.description}</Text>}
        <View style={styles.headerMetaRow}>
          <Text style={styles.headerMeta}>👥 {agency._count.members} عضو</Text>
          <Text style={styles.headerMeta}>المالك: {agency.owner.fullName}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {dashboard && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>التاركت الشهري</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{dashboard.monthlyDiamonds.toLocaleString("en")}</Text>
                <Text style={styles.statLabel}>ألماس هذا الشهر</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{dashboard.expectedMonthlySalaryUsd}$</Text>
                <Text style={styles.statLabel}>الراتب الشهري المتوقع</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${dashboard.progressPercent}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              {dashboard.currentTier
                ? `المستوى الحالي: ${dashboard.currentTier.thresholdDiamonds.toLocaleString("en")} ألماسة (${dashboard.currentTier.salaryUsd}$)`
                : "لم تصل لأول مستوى تاركت بعد"}
              {dashboard.nextTier
                ? ` — التالي: ${dashboard.nextTier.thresholdDiamonds.toLocaleString("en")} ألماسة`
                : ""}
            </Text>

            {tiers && tiers.length > 0 && (
              <View style={styles.tierTable}>
                {tiers.map((tier) => {
                  const threshold = Number(tier.thresholdDiamonds);
                  const reached = dashboard.monthlyDiamonds >= threshold;
                  return (
                    <View key={tier.id} style={[styles.tierRow, reached && styles.tierRowReached]}>
                      <Text style={[styles.tierSalary, reached && styles.tierTextReached]}>{tier.salaryUsd}$</Text>
                      <Text style={[styles.tierThreshold, reached && styles.tierTextReached]}>
                        {threshold.toLocaleString("en")} ألماسة {reached ? "✓" : ""}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{dashboard.withdrawableDiamonds.toLocaleString("en")}</Text>
                <Text style={styles.statLabel}>ألماس قابل للفك</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{dashboard.withdrawableUsd}$</Text>
                <Text style={styles.statLabel}>القيمة بالدولار</Text>
              </View>
            </View>

            {!withdrawing ? (
              <TouchableOpacity style={styles.button} onPress={() => setWithdrawing(true)}>
                <Text style={styles.buttonText}>فك الألماس</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.fieldLabel}>عدد الألماس</Text>
                <TextInput
                  style={styles.input}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                />
                <Text style={styles.fieldLabel}>طريقة الاستلام</Text>
                <TextInput style={styles.input} value={withdrawMethod} onChangeText={setWithdrawMethod} />
                <Text style={styles.fieldLabel}>رقم الحساب</Text>
                <TextInput style={styles.input} value={withdrawAccount} onChangeText={setWithdrawAccount} />
                {withdrawError && <Text style={styles.error}>{withdrawError}</Text>}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.button, { flex: 1 }]}
                    disabled={!withdrawAmount || !withdrawMethod || !withdrawAccount || withdrawMutation.isPending}
                    onPress={() => withdrawMutation.mutate()}
                  >
                    {withdrawMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>إرسال الطلب</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.buttonSecondary, { flex: 1 }]} onPress={() => setWithdrawing(false)}>
                    <Text style={styles.buttonText}>إلغاء</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {dashboard.withdrawalHistory.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>سجل عمليات الفك</Text>
                {dashboard.withdrawalHistory.map((req) => (
                  <View key={req.id} style={styles.hostIncomeRow}>
                    <Text style={styles.hostIncomeName}>
                      {WITHDRAWAL_STATUS_LABEL[req.status] ?? req.status}
                    </Text>
                    <Text style={styles.hostIncomeValue}>
                      {Number(req.diamondsAmount).toLocaleString("en")} ألماسة ({req.usdAmount}$)
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {isOwner && agencyDashboard && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>أرباح الوكالة</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{agencyDashboard.effectiveCommissionRate}%</Text>
                <Text style={styles.statLabel}>نسبة العمولة الحالية</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{agencyDashboard.commissionBalance.toFixed(2)}$</Text>
                <Text style={styles.statLabel}>رصيد قابل للسحب</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{agencyDashboard.dailyProfitUsd.toFixed(2)}$</Text>
                <Text style={styles.statLabel}>أرباح اليوم</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{agencyDashboard.monthlyProfitUsd.toFixed(2)}$</Text>
                <Text style={styles.statLabel}>أرباح الشهر</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>دخل كل مضيف هذا الشهر</Text>
            {agencyDashboard.hosts.map((host) => (
              <View key={host.userId} style={styles.hostIncomeRow}>
                <Text style={styles.hostIncomeName}>{host.fullName}</Text>
                <Text style={styles.hostIncomeValue}>{host.monthlyDiamonds.toLocaleString("en")} ألماسة</Text>
              </View>
            ))}

            {!agencyWithdrawing ? (
              <TouchableOpacity style={styles.button} onPress={() => setAgencyWithdrawing(true)}>
                <Text style={styles.buttonText}>سحب رصيد العمولة</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.fieldLabel}>المبلغ ($)</Text>
                <TextInput
                  style={styles.input}
                  value={agencyWithdrawAmount}
                  onChangeText={setAgencyWithdrawAmount}
                  keyboardType="numeric"
                />
                <Text style={styles.fieldLabel}>طريقة الاستلام</Text>
                <TextInput style={styles.input} value={agencyWithdrawMethod} onChangeText={setAgencyWithdrawMethod} />
                <Text style={styles.fieldLabel}>رقم الحساب</Text>
                <TextInput style={styles.input} value={agencyWithdrawAccount} onChangeText={setAgencyWithdrawAccount} />
                {agencyWithdrawError && <Text style={styles.error}>{agencyWithdrawError}</Text>}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.button, { flex: 1 }]}
                    disabled={
                      !agencyWithdrawAmount ||
                      !agencyWithdrawMethod ||
                      !agencyWithdrawAccount ||
                      agencyWithdrawMutation.isPending
                    }
                    onPress={() => agencyWithdrawMutation.mutate()}
                  >
                    {agencyWithdrawMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>إرسال الطلب</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buttonSecondary, { flex: 1 }]}
                    onPress={() => setAgencyWithdrawing(false)}
                  >
                    <Text style={styles.buttonText}>إلغاء</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {isOwner && !editing && (
          <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
            <Text style={styles.buttonText}>تعديل بيانات الوكالة</Text>
          </TouchableOpacity>
        )}

        {isOwner && editing && (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>اسم الوكالة</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.fieldLabel}>الوصف</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.button, { flex: 1 }]}
                disabled={!name || updateMutation.isPending}
                onPress={() => updateMutation.mutate()}
              >
                {updateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>حفظ</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.buttonSecondary, { flex: 1 }]} onPress={() => setEditing(false)}>
                <Text style={styles.buttonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>الأعضاء ({agency.members.length})</Text>
        {agency.members.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            {isOwner && member.userId !== user?.id && (
              <TouchableOpacity
                style={styles.kickButton}
                disabled={kickMutation.isPending}
                onPress={() => kickMutation.mutate(member.userId)}
              >
                <Text style={styles.kickButtonText}>طرد</Text>
              </TouchableOpacity>
            )}
            <View style={styles.memberRoleBadge}>
              <Text style={styles.memberRole}>{member.role === "OWNER" ? "المالك" : "مضيف"}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.user.fullName}</Text>
              <Text style={styles.memberUsername}>@{member.user.username}</Text>
            </View>
            <Avatar name={member.user.username} imageUrl={member.user.avatarUrl} size={40} />
          </View>
        ))}

        {isOwner ? (
          <TouchableOpacity style={styles.dangerButton} onPress={() => dissolveMutation.mutate()}>
            <Text style={styles.dangerButtonText}>حل الوكالة نهائيًا</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.dangerButton} onPress={() => leaveMutation.mutate()}>
            <Text style={styles.dangerButtonText}>مغادرة الوكالة</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { padding: spacing.xl },
  agencyName: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "right" },
  agencyDescription: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: spacing.sm, textAlign: "right" },
  headerMetaRow: { flexDirection: "row-reverse", gap: spacing.md, marginTop: spacing.md },
  headerMeta: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  body: { padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
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
  actionsRow: { flexDirection: "row-reverse", gap: spacing.md, marginTop: spacing.md },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", textAlign: "right", marginVertical: spacing.md },
  memberRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberInfo: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end" },
  memberName: { color: colors.textPrimary, fontWeight: "600" },
  memberUsername: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  memberRoleBadge: {
    backgroundColor: "rgba(91, 76, 245, 0.15)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginEnd: spacing.sm,
  },
  memberRole: { color: colors.primaryLight, fontSize: 11, fontWeight: "700" },
  kickButton: { backgroundColor: "rgba(255,107,107,0.15)", borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  kickButtonText: { color: colors.danger, fontSize: 11, fontWeight: "700" },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: "center", marginBottom: spacing.lg },
  buttonSecondary: { backgroundColor: colors.surfaceMuted, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  dangerButton: {
    backgroundColor: "rgba(255,107,107,0.12)",
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  dangerButtonText: { color: colors.danger, fontWeight: "700" },
  error: { color: colors.danger, textAlign: "center", marginTop: spacing.sm },
  statsRow: { flexDirection: "row-reverse", gap: spacing.md, marginBottom: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: "center",
  },
  statValue: { color: colors.textPrimary, fontWeight: "800", fontSize: 17 },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4, textAlign: "center" },
  progressTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: radii.pill },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "right",
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  tierTable: { marginBottom: spacing.md, gap: spacing.xs },
  tierRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tierRowReached: { backgroundColor: "rgba(76,217,100,0.14)" },
  tierThreshold: { color: colors.textSecondary, fontSize: 12 },
  tierSalary: { color: colors.textPrimary, fontWeight: "700", fontSize: 12 },
  tierTextReached: { color: colors.success },
  hostIncomeRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  hostIncomeName: { color: colors.textPrimary, fontSize: 13 },
  hostIncomeValue: { color: colors.textSecondary, fontSize: 12 },
});
