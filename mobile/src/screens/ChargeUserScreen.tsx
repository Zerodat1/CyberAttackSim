import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { FormField } from "@/components/FormField";
import { colors, radii, spacing, typography } from "@/theme";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "ChargeUser">;

const AMOUNTS = [10, 20, 50, 100, 500];

export function ChargeUserScreen(_props: Props) {
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleCharge() {
    if (!amount) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await apiClient.post("/recharge-agency/charge", { targetUserId, amount });
      setSuccess(`تم الشحن بنجاح. رقم العملية: ${data.transactionNumber}`);
      setTargetUserId("");
      setAmount(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "فشلت عملية الشحن");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.subtitle}>أدخل معرّف المستخدم واختر المبلغ لشحن رصيده الذهبي فورًا</Text>

      <View style={styles.card}>
        <FormField
          label="معرّف المستخدم (ID)"
          placeholder="00000000-0000-0000-0000-000000000000"
          value={targetUserId}
          onChangeText={setTargetUserId}
          autoCapitalize="none"
        />

        <Text style={styles.label}>المبلغ</Text>
        <View style={styles.amountsRow}>
          {AMOUNTS.map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.amountChip, amount === value && styles.amountChipActive]}
              onPress={() => setAmount(value)}
            >
              <Text style={[styles.amountText, amount === value && styles.amountTextActive]}>{value}$</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
        style={[styles.button, (!amount || !targetUserId || submitting) && styles.buttonDisabled]}
        onPress={handleCharge}
        disabled={!amount || !targetUserId || submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>شحن</Text>}
      </TouchableOpacity>
    </View>
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
  amountsRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: spacing.sm },
  amountChip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  amountChipActive: { backgroundColor: colors.primary },
  amountText: { color: colors.textSecondary, fontWeight: "600" },
  amountTextActive: { color: "#fff" },
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
