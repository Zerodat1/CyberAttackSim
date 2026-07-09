import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@/auth/AuthContext";
import { colors, radii, spacing } from "@/theme";
import type { AuthStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    setSubmitting(true);
    setError(null);
    try {
      await register({ fullName, username, email, password });
    } catch {
      setError("تعذر إنشاء الحساب، تأكد من صحة البيانات");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#241a4d", "#0f1020", "#0a0a1a"]} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient colors={[colors.primary, "#8a3ffb"]} style={styles.logo}>
          <Text style={styles.logoText}>C</Text>
        </LinearGradient>
        <Text style={styles.title}>إنشاء حساب جديد</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="الاسم الكامل"
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="اسم المستخدم"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>إنشاء الحساب</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>لديك حساب بالفعل؟ تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  glowTop: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(124, 108, 249, 0.22)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -120,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(245, 196, 81, 0.08)",
  },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.xxl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  logoText: { color: "#fff", fontSize: 26, fontWeight: "800" },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, textAlign: "center", marginBottom: spacing.xxl },
  form: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    marginBottom: spacing.md,
    textAlign: "right",
  },
  button: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 15, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm },
  link: { color: colors.primaryLight, textAlign: "center", marginTop: spacing.xl },
});
