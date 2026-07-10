import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { FormField } from "@/components/FormField";
import { colors, radii, spacing, typography } from "@/theme";
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.subtitle}>
        املأ البيانات التالية لتقديم طلب فتح وكالة شحن جديدة، وسيتم مراجعته من قبل الإدارة
      </Text>

      <View style={styles.card}>
        <FormField label="الاسم الكامل" placeholder="مثال: محمد أحمد" value={fullName} onChangeText={setFullName} />
        <FormField label="اسم الوكالة" placeholder="اسم وكالتك التجاري" value={agencyName} onChangeText={setAgencyName} />
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField label="الدولة" placeholder="الدولة" value={country} onChangeText={setCountry} />
          </View>
          <View style={styles.half}>
            <FormField label="المدينة" placeholder="المدينة" value={city} onChangeText={setCity} />
          </View>
        </View>
        <FormField
          label="رقم الهاتف"
          placeholder="+9665xxxxxxxx"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <FormField
          label="البريد الإلكتروني"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <FormField
          label="وسائل الدفع المتوفرة"
          placeholder="فيزا، تحويل بنكي، ..."
          value={paymentMethods}
          onChangeText={setPaymentMethods}
        />
      </View>

      <View style={styles.switchRow}>
        <Switch
          value={termsAccepted}
          onValueChange={setTermsAccepted}
          trackColor={{ true: colors.primary }}
        />
        <Text style={styles.switchLabel}>أوافق على الشروط والأحكام</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, (!termsAccepted || submitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!termsAccepted || submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>إرسال الطلب</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.xxl },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "right",
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  card: { backgroundColor: colors.surfaceAlt, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.lg },
  row: { flexDirection: "row-reverse", gap: spacing.md },
  half: { flex: 1 },
  switchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  switchLabel: { color: colors.textPrimary, fontSize: 14 },
  errorBanner: {
    backgroundColor: "rgba(255,107,107,0.12)",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.danger, textAlign: "center", fontSize: 13 },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 16, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
