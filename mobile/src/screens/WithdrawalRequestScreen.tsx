import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiClient } from "@/api/client";
import { FormField } from "@/components/FormField";
import { colors, radii, spacing, typography } from "@/theme";

export function WithdrawalRequestScreen() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post("/recharge-agency/wallet/withdrawals", {
        amount: Number(amount),
        method,
        accountNumber,
        notes: notes || undefined,
      });
      setSuccess("تم إرسال طلب السحب بنجاح، بانتظار المراجعة");
      setAmount("");
      setMethod("");
      setAccountNumber("");
      setNotes("");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "تعذر إرسال طلب السحب");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.subtitle}>اطلب سحب أرباحك المتاحة إلى الحساب الذي تختاره</Text>

      <View style={styles.card}>
        <FormField
          label="المبلغ"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <FormField label="طريقة السحب" placeholder="تحويل بنكي، محفظة إلكترونية..." value={method} onChangeText={setMethod} />
        <FormField
          label="رقم الحساب"
          placeholder="رقم الحساب أو المحفظة"
          value={accountNumber}
          onChangeText={setAccountNumber}
        />
        <FormField label="ملاحظات (اختياري)" placeholder="أي تفاصيل إضافية" value={notes} onChangeText={setNotes} />
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
        style={[styles.button, (!amount || !method || !accountNumber || submitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!amount || !method || !accountNumber || submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>إرسال الطلب</Text>}
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
