import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { apiClient } from "@/api/client";

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
    <View style={styles.container}>
      <Text style={styles.title}>طلب سحب الأرباح</Text>
      <TextInput
        style={styles.input}
        placeholder="المبلغ"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput style={styles.input} placeholder="طريقة السحب" value={method} onChangeText={setMethod} />
      <TextInput
        style={styles.input}
        placeholder="رقم الحساب"
        value={accountNumber}
        onChangeText={setAccountNumber}
      />
      <TextInput style={styles.input} placeholder="ملاحظات (اختياري)" value={notes} onChangeText={setNotes} />
      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>{success}</Text>}
      <TouchableOpacity
        style={[styles.button, (!amount || !method || !accountNumber) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!amount || !method || !accountNumber || submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>إرسال الطلب</Text>}
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
    marginBottom: 14,
    textAlign: "right",
  },
  button: { backgroundColor: "#5b4cf5", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#ff6b6b", textAlign: "center", marginBottom: 8 },
  success: { color: "#4cd964", textAlign: "center", marginBottom: 8 },
});
