import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiClient } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Avatar } from "@/components/Avatar";
import { colors, radii, spacing, typography } from "@/theme";
import type { UserProfile } from "@/api/types";

const ROLE_LABEL: Record<string, string> = {
  USER: "مستخدم",
  RECHARGE_MANAGER: "مدير شحن",
  OWNER: "المالك",
};

export function ProfileScreen() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await apiClient.get<UserProfile>("/users/me")).data,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setBio(profile.bio ?? "");
      setCountry(profile.country ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiClient.patch("/users/me", {
        fullName,
        bio: bio || undefined,
        country: country || undefined,
        avatarUrl: avatarUrl || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await refreshUser();
      setEditing(false);
      setError(null);
    },
    onError: () => setError("تعذر حفظ التعديلات، تحقق من صحة البيانات (مثل رابط الصورة)"),
  });

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar name={profile.fullName} imageUrl={editing ? avatarUrl : profile.avatarUrl} size={84} />
        {!editing && (
          <>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </>
        )}
      </View>

      {!editing ? (
        <>
          <View style={styles.card}>
            <InfoRow label="الدور" value={ROLE_LABEL[profile.globalRole] ?? profile.globalRole} />
            <InfoRow label="الدولة" value={profile.country ?? "غير محددة"} />
            <InfoRow label="البريد الإلكتروني" value={profile.email ?? "—"} />
            <InfoRow label="رقم الهاتف" value={profile.phone ?? "—"} />
            <InfoRow
              label="المصادقة الثنائية"
              value={profile.twoFactorEnabled ? "مفعّلة" : "غير مفعّلة"}
            />
            <InfoRow label="تاريخ الانضمام" value={new Date(profile.createdAt).toLocaleDateString("ar")} />
          </View>

          <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
            <Text style={styles.buttonText}>تعديل الملف الشخصي</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>الاسم الكامل</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

          <Text style={styles.fieldLabel}>نبذة تعريفية</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={160}
            placeholder="اكتب نبذة قصيرة عن نفسك..."
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.fieldLabel}>الدولة</Text>
          <TextInput style={styles.input} value={country} onChangeText={setCountry} />

          <Text style={styles.fieldLabel}>رابط صورة الملف الشخصي</Text>
          <TextInput
            style={styles.input}
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, { flex: 1 }]}
              disabled={saveMutation.isPending}
              onPress={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>حفظ التغييرات</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonSecondary, { flex: 1 }]}
              onPress={() => {
                setEditing(false);
                setError(null);
              }}
            >
              <Text style={styles.buttonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.value}>{value}</Text>
      <Text style={rowStyles.label}>{label}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  label: { color: colors.textSecondary, fontSize: 13 },
  value: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
});

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { alignItems: "center", marginBottom: spacing.xl },
  name: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.md },
  username: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  bio: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.sm, textAlign: "center" },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.xl },
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
  actionsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonSecondary: { backgroundColor: colors.surfaceMuted, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: colors.danger, textAlign: "center", marginTop: spacing.sm },
});
