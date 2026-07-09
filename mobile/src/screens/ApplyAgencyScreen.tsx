import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "ApplyAgency">;

export function ApplyAgencyScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post("/recharge-agency/applications", {
        fullName,
        agencyName,
        country,
        city,
        phone,
        email,
        paymentMethods: paymentMethods.split(",").map((m) => m.trim()).filter(Boolean),
        termsAccepted,
      });
      navigation.goBack();
    } catch {
      setError("تعذر إرسال الطلب، تحقق من البيانات المدخلة");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>التقديم لفتح وكالة شحن</Text>
      <TextInput style={styles.input} placeholder="الاسم الكامل" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="اسم الوكالة" value={agencyName} onChangeText={setAgencyName} />
      <TextInput style={styles.input} placeholder="الدولة" value={country} onChangeText={setCountry} />
      <TextInput style={styles.input} placeholder="المدينة" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="رقم الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput
        style={styles.input}
        placeholder="وسائل الدفع المتوفرة (مفصولة بفاصلة)"
        value={paymentMethods}
        onChangeText={setPaymentMethods}
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>أوافق على الشروط والأحكام</Text>
        <Switch value={termsAccepted} onValueChange={setTermsAccepted} />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={[styles.button, !termsAccepted && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!termsAccepted || submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>إرسال الطلب</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: "#0f1020" },
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
  switchRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  switchLabel: { color: "#fff" },
  button: { backgroundColor: "#5b4cf5", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#ff6b6b", textAlign: "center", marginBottom: 8 },
});
