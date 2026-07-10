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
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Avatar } from "@/components/Avatar";
import { colors, radii, spacing, typography } from "@/theme";
import type { Gender, HostAgencyMembership, LevelInfo, UserProfile, VipLevel } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import { resolveFrame, resolveVipBadge } from "@/utils/cosmetics";

type Props = NativeStackScreenProps<AppStackParamList, "Profile">;

const ROLE_LABEL: Record<string, string> = {
  USER: "مستخدم",
  RECHARGE_MANAGER: "مدير شحن",
  OWNER: "المالك",
};

const GENDER_LABEL: Record<Gender, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
};

const MENU_ITEMS = [
  { icon: "🎙️", label: "الغرف الصوتية", screen: "RoomsList" as const },
  { icon: "💬", label: "الرسائل", screen: "ConversationsList" as const },
  { icon: "🛍️", label: "المتجر", screen: "Store" as const },
  { icon: "👑", label: "VIP", screen: "Vip" as const },
  { icon: "🎁", label: "سجل الهدايا", screen: "GiftHistory" as const },
  { icon: "🎲", label: "سجل الألعاب", screen: "GameHistory" as const },
];

export function ProfileScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const { refreshUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await apiClient.get<UserProfile>("/users/me")).data,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await apiClient.get<{ goldBalance: string; diamondBalance: string }>("/wallet/me")).data,
  });

  const { data: agencyMembership } = useQuery({
    queryKey: ["my-host-agency"],
    queryFn: async () => (await apiClient.get<HostAgencyMembership | null>("/host-agencies/me")).data,
  });

  const { data: vipLevels } = useQuery({
    queryKey: ["vip-levels"],
    queryFn: async () => (await apiClient.get<VipLevel[]>("/vip/levels")).data,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setBio(profile.bio ?? "");
      setCountry(profile.country ?? "");
      setEmail(profile.email ?? "");
      setGender(profile.gender ?? undefined);
      setAvatarUrl(profile.avatarUrl ?? "");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiClient.patch("/users/me", {
        fullName,
        bio: bio || undefined,
        country: country || undefined,
        email: email || undefined,
        gender: gender || undefined,
        avatarUrl: avatarUrl || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await refreshUser();
      setEditing(false);
      setError(null);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message;
      setError(
        typeof message === "string"
          ? message
          : "تعذر حفظ التعديلات، تحقق من صحة البيانات (البريد الإلكتروني أو الصورة)",
      );
    },
  });

  async function copyId() {
    if (!profile) return;
    await Clipboard.setStringAsync(profile.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function pickImage() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("يجب السماح بالوصول إلى الصور لتغيير صورة الملف الشخصي");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (asset?.base64) {
      const mime = asset.mimeType ?? "image/jpeg";
      setAvatarUrl(`data:${mime};base64,${asset.base64}`);
    }
  }

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const profileFrame = resolveFrame(profile, vipLevels);
  const vipBadgeLabel = resolveVipBadge(profile, vipLevels);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <LinearGradient colors={[colors.primary, "#8a3ffb"]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        {!editing && (
          <TouchableOpacity style={styles.editIconButton} onPress={() => setEditing(true)}>
            <Text style={styles.editIconText}>✏️</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.avatarRing, profileFrame && { borderColor: profileFrame.color }]}
          onPress={editing ? pickImage : undefined}
          activeOpacity={editing ? 0.7 : 1}
        >
          <Avatar
            name={profile.fullName}
            imageUrl={editing ? avatarUrl : profile.avatarUrl}
            size={88}
            frameColor={profileFrame?.color}
            frameEmoji={profileFrame?.emoji}
          />
          {editing && (
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeText}>📷</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.username}>@{profile.username}</Text>

        <TouchableOpacity style={styles.idRow} onPress={copyId}>
          <Text style={styles.idText}>ID: {profile.id.slice(0, 8)}</Text>
          <Text style={styles.copyIcon}>{copied ? "✓" : "📋"}</Text>
        </TouchableOpacity>

        <View style={styles.badgesRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{ROLE_LABEL[profile.globalRole] ?? profile.globalRole}</Text>
          </View>
          {vipBadgeLabel && (
            <View style={[styles.roleBadge, { backgroundColor: "rgba(0,0,0,0.25)" }]}>
              <Text style={styles.roleBadgeText}>👑 {vipBadgeLabel}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {wallet && (
          <LinearGradient colors={["#2a2c60", "#1c1e3a"]} style={styles.walletCard}>
            <View style={styles.walletItem}>
              <Text style={styles.walletValue}>{wallet.goldBalance}</Text>
              <Text style={styles.walletLabel}>ذهب 💰</Text>
            </View>
            <View style={styles.walletDivider} />
            <View style={styles.walletItem}>
              <Text style={[styles.walletValue, { color: colors.diamond }]}>{wallet.diamondBalance}</Text>
              <Text style={styles.walletLabel}>ألماس 💎</Text>
            </View>
          </LinearGradient>
        )}

        <View style={styles.levelsRow}>
          <LevelCard icon="💰" label="مستوى الثروة" info={profile.levels.wealth} color={colors.gold} />
          <LevelCard icon="✨" label="مستوى الجاذبية" info={profile.levels.charm} color={colors.giftPink} />
        </View>

        <TouchableOpacity style={styles.agencyCard} onPress={() => navigation.navigate("HostAgencies")}>
          <Text style={styles.agencyChevron}>›</Text>
          <View style={styles.agencyInfo}>
            <Text style={styles.agencyLabel}>{agencyMembership ? agencyMembership.agency.name : "لست عضوًا في أي وكالة"}</Text>
            <Text style={styles.agencySubtitle}>
              {agencyMembership
                ? `${agencyMembership.role === "OWNER" ? "المالك" : "مضيف"} · 👥 ${agencyMembership.agency._count.members}`
                : "انضم إلى وكالة مضيفين أو أنشئ وكالتك الخاصة"}
            </Text>
          </View>
          <Text style={styles.agencyIcon}>🏢</Text>
        </TouchableOpacity>

        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!editing ? (
          <>
            <View style={styles.card}>
              {profile.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : (
                <Text style={styles.bioPlaceholder}>لم تُضِف نبذة تعريفية بعد</Text>
              )}
            </View>

            <View style={styles.card}>
              <InfoRow label="الدولة" value={profile.country ?? "غير محددة"} />
              <InfoRow label="الجنس" value={profile.gender ? GENDER_LABEL[profile.gender] : "غير محدد"} />
              <InfoRow label="البريد الإلكتروني" value={profile.email ?? "—"} />
              <InfoRow label="رقم الهاتف" value={profile.phone ?? "—"} />
              <InfoRow label="المصادقة الثنائية" value={profile.twoFactorEnabled ? "مفعّلة" : "غير مفعّلة"} />
              <InfoRow label="تاريخ الانضمام" value={new Date(profile.createdAt).toLocaleDateString("ar")} last />
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={() => logout()}>
              <Text style={styles.logoutText}>تسجيل الخروج</Text>
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

            <Text style={styles.fieldLabel}>الجنس</Text>
            <View style={styles.genderRow}>
              {(Object.keys(GENDER_LABEL) as Gender[]).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.genderOption, gender === value && styles.genderOptionActive]}
                  onPress={() => setGender(value)}
                >
                  <Text style={[styles.genderOptionText, gender === value && styles.genderOptionTextActive]}>
                    {GENDER_LABEL[value]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
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
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[rowStyles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={rowStyles.value}>{value}</Text>
      <Text style={rowStyles.label}>{label}</Text>
    </View>
  );
}

function LevelCard({ icon, label, info, color }: { icon: string; label: string; info: LevelInfo; color: string }) {
  const progressPct = Math.max(0, Math.min(1, info.progress)) * 100;
  return (
    <View style={levelStyles.card}>
      <View style={levelStyles.headerRow}>
        <Text style={[levelStyles.levelValue, { color }]}>Lv.{info.level}</Text>
        <Text style={levelStyles.icon}>{icon}</Text>
      </View>
      <Text style={levelStyles.label}>{label}</Text>
      <View style={levelStyles.progressTrack}>
        <View style={[levelStyles.progressFill, { width: `${progressPct}%`, backgroundColor: color }]} />
      </View>
      <Text style={levelStyles.exp}>
        {info.exp} {info.nextThreshold ? `/ ${info.nextThreshold}` : "(أعلى مستوى)"}
      </Text>
    </View>
  );
}

const levelStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md },
  headerRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  levelValue: { fontWeight: "800", fontSize: 16 },
  icon: { fontSize: 16 },
  label: { color: colors.textSecondary, fontSize: 11, textAlign: "right", marginTop: 2, marginBottom: spacing.sm },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  exp: { color: colors.textMuted, fontSize: 10, textAlign: "right", marginTop: spacing.xs },
});

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
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { paddingTop: 56, paddingBottom: spacing.xxl, alignItems: "center" },
  backButton: { position: "absolute", top: 52, left: spacing.lg, padding: spacing.xs },
  backButtonText: { color: "#fff", fontSize: 32, fontWeight: "300", lineHeight: 32 },
  editIconButton: {
    position: "absolute",
    top: 52,
    right: spacing.lg,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  editIconText: { fontSize: 16 },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    marginBottom: spacing.md,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cameraBadgeText: { fontSize: 12 },
  name: { ...typography.heading, color: "#fff", fontSize: 20 },
  username: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },
  idRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.md,
  },
  idText: { color: "#fff", fontSize: 12 },
  copyIcon: { fontSize: 12 },
  badgesRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  body: { padding: spacing.xl, marginTop: -spacing.lg },
  walletCard: {
    flexDirection: "row",
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    justifyContent: "space-around",
    alignItems: "center",
  },
  walletItem: { alignItems: "center", flex: 1 },
  walletDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.08)" },
  walletValue: { color: colors.gold, fontSize: 20, fontWeight: "800" },
  walletLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  levelsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
  agencyCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  agencyIcon: { fontSize: 24 },
  agencyInfo: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end" },
  agencyLabel: { color: colors.textPrimary, fontWeight: "700", fontSize: 14, textAlign: "right" },
  agencySubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 2, textAlign: "right" },
  agencyChevron: { color: colors.textMuted, fontSize: 20, transform: [{ scaleX: -1 }] },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.xl },
  menuItem: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  menuIcon: { fontSize: 26, marginBottom: 4 },
  menuLabel: { color: colors.textPrimary, fontWeight: "700", fontSize: 13 },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.xl },
  bio: { color: colors.textPrimary, fontSize: 14, textAlign: "right", lineHeight: 20 },
  bioPlaceholder: { color: colors.textMuted, fontSize: 13, textAlign: "right", fontStyle: "italic" },
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
  genderRow: { flexDirection: "row-reverse", gap: spacing.sm },
  genderOption: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  genderOptionActive: { backgroundColor: colors.primary, borderColor: colors.primaryLight },
  genderOptionText: { color: colors.textSecondary, fontWeight: "600", fontSize: 13 },
  genderOptionTextActive: { color: "#fff" },
  actionsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonSecondary: { backgroundColor: colors.surfaceMuted, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  logoutButton: { alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.sm },
  logoutText: { color: colors.danger, fontWeight: "600" },
  error: { color: colors.danger, textAlign: "center", marginTop: spacing.sm },
});
