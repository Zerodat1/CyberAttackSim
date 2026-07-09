import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
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
    <View style={styles.container}>
      <Text style={styles.title}>شحن مستخدم</Text>
      <TextInput
        style={styles.input}
        placeholder="ID المستخدم"
        value={targetUserId}
        onChangeText={setTargetUserId}
        autoCapitalize="none"
      />
      <View style={styles.amountsRow}>
        {AMOUNTS.map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.amountChip, amount === value && styles.amountChipActive]}
            onPress={() => setAmount(value)}
          >
            <Text style={styles.amountText}>{value}$</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>{success}</Text>}
      <TouchableOpacity
        style={[styles.button, (!amount || !targetUserId) && styles.buttonDisabled]}
        onPress={handleCharge}
        disabled={!amount || !targetUserId || submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>شحن</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#0f1020" },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", textAlign: "right", marginBottom: 20 },
  input: {
    backgroundColor: "#1c1e3a",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    textAlign: "right",
  },
  amountsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  amountChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1c1e3a",
  },
  amountChipActive: { backgroundColor: "#5b4cf5" },
  amountText: { color: "#fff", fontWeight: "600" },
  button: { backgroundColor: "#5b4cf5", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#ff6b6b", textAlign: "center", marginBottom: 8 },
  success: { color: "#4cd964", textAlign: "center", marginBottom: 8 },
});
