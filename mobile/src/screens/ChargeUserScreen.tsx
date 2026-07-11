import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { FormField } from "@/components/FormField";
import { colors, radii, spacing, typography } from "@/theme";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import type { RechargePackage } from "@/api/types";

type Props = NativeStackScreenProps<AppStackParamList, "ChargeUser">;

export function ChargeUserScreen(_props: Props) {
  const [targetUserId, setTargetUserId] = useState("");
  const [packageId, setPackageId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: packages } = useQuery({
    queryKey: ["recharge-packages"],
    queryFn: async () => (await apiClient.get<RechargePackage[]>("/recharge-agency/packages")).data,
  });

  const selectedPackage = packages?.find((p) => p.id === packageId);

  async function handleCharge() {
    if (!packageId) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await apiClient.post("/recharge-agency/charge", { targetUserId, packageId });
      setSuccess(`تم الشحن بنجاح. رقم العملية: ${data.transactionNumber}`);
      setTargetUserId("");
      setPackageId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "فشلت عملية الشحن");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <Text style={styles.subtitle}>أدخل معرّف المستخدم واختر باقة الشحن — يُضاف البونص تلقائيًا لرصيده</Text>

      <View style={styles.card}>
        <FormField
          label="معرّف المستخدم (ID)"
          placeholder="00000000-0000-0000-0000-000000000000"
          value={targetUserId}
          onChangeText={setTargetUserId}
          autoCapitalize="none"
        />

        <Text style={styles.label}>باقة الشحن</Text>
        <View style={styles.packagesList}>
          {packages?.map((pkg) => {
            const active = packageId === pkg.id;
            const hasBonus = Number(pkg.bonusPercent) > 0;
            return (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.packageCard, active && styles.packageCardActive]}
                onPress={() => setPackageId(pkg.id)}
              >
                <View style={styles.packageHeaderRow}>
                  <Text style={[styles.packagePrice, active && styles.packageTextActive]}>{pkg.priceUsd}$</Text>
                  {hasBonus && (
                    <View style={styles.bonusBadge}>
                      <Text style={styles.bonusBadgeText}>+{Number(pkg.bonusPercent)}% بونص</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.packageGold, active && styles.packageTextActive]}>
                  {Number(pkg.totalGold).toLocaleString("en")} ذهب
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedPackage && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            سيحصل المستخدم على {Number(selectedPackage.totalGold).toLocaleString("en")} ذهب مقابل{" "}
            {selectedPackage.priceUsd}$
            {Number(selectedPackage.bonusPercent) > 0
              ? ` (يشمل بونص ${selectedPackage.bonusPercent}%)`
              : ""}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, (!packageId || !targetUserId || submitting) && styles.buttonDisabled]}
        onPress={handleCharge}
        disabled={!packageId || !targetUserId || submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>شحن</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xxl },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "right",
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  card: { backgroundColor: colors.surfaceAlt, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  packagesList: { gap: spacing.sm },
  packageCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  packageCardActive: { backgroundColor: colors.primary },
  packageHeaderRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  packagePrice: { color: colors.textPrimary, fontWeight: "800", fontSize: 16 },
  packageGold: { color: colors.textSecondary, fontWeight: "600", textAlign: "right" },
  packageTextActive: { color: "#fff" },
  bonusBadge: {
    backgroundColor: "rgba(76,217,100,0.18)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  bonusBadgeText: { color: colors.success, fontSize: 11, fontWeight: "700" },
  summaryCard: {
    backgroundColor: "rgba(91, 76, 245, 0.1)",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryText: { color: colors.primary, textAlign: "right", fontSize: 13, fontWeight: "600" },
  errorBanner: {
    backgroundColor: "rgba(255,107,107,0.12)",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.danger, textAlign: "center", fontSize: 13 },
  successBanner: {
    backgroundColor: "rgba(76,217,100,0.12)",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successText: { color: colors.success, textAlign: "center", fontSize: 13 },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 16, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
