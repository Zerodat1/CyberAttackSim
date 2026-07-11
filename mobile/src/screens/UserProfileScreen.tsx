import { useMutation, useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Avatar } from "@/components/Avatar";
import { colors, radii, spacing, typography } from "@/theme";
import type { Gender, LevelInfo, PublicUserProfile, VipLevel } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";
import { resolveFrame, resolveVipBadge } from "@/utils/cosmetics";

type Props = NativeStackScreenProps<AppStackParamList, "UserProfile">;

const ROLE_LABEL: Record<string, string> = {
  USER: "مستخدم",
  RECHARGE_MANAGER: "مدير شحن",
  OWNER: "المالك",
  ADMIN: "أدمن",
};

const GENDER_LABEL: Record<Gender, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
};

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => (await apiClient.get<PublicUserProfile>(`/users/${userId}`)).data,
  });

  const { data: vipLevels } = useQuery({
    queryKey: ["vip-levels"],
    queryFn: async () => (await apiClient.get<VipLevel[]>("/vip/levels")).data,
    staleTime: 5 * 60 * 1000,
  });

  const startConversationMutation = useMutation({
    mutationFn: async () => (await apiClient.post<{ id: string }>("/messaging/conversations", { targetUserId: userId })).data,
    onSuccess: (conversation) => {
      navigation.navigate("Chat", { conversationId: conversation.id, otherUserName: profile?.fullName ?? "" });
    },
  });

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const isSelf = currentUser?.id === userId;
  const profileFrame = resolveFrame(profile, vipLevels);
  const vipBadgeLabel = resolveVipBadge(profile, vipLevels);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <LinearGradient colors={[colors.primary, "#8a3ffb"]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={[styles.avatarRing, profileFrame && { borderColor: profileFrame.color }]}>
          <Avatar
            name={profile.fullName}
            imageUrl={profile.avatarUrl}
            size={88}
            frameColor={profileFrame?.color}
            frameEmoji={profileFrame?.emoji}
          />
        </View>
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        <Text style={styles.idText}>ID: {profile.id.slice(0, 8)}</Text>

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
        <View style={styles.levelsRow}>
          <LevelCard icon="💰" label="مستوى الثروة" info={profile.levels.wealth} color={colors.gold} />
          <LevelCard icon="✨" label="مستوى الجاذبية" info={profile.levels.charm} color={colors.giftPink} />
        </View>

        <View style={styles.card}>
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioPlaceholder}>لم يُضِف هذا المستخدم نبذة تعريفية بعد</Text>
          )}
        </View>

        <View style={styles.card}>
          <InfoRow label="الدولة" value={profile.country ?? "غير محددة"} />
          <InfoRow label="الجنس" value={profile.gender ? GENDER_LABEL[profile.gender] : "غير محدد"} last />
        </View>

        {!isSelf && (
          <TouchableOpacity
            style={[styles.button, startConversationMutation.isPending && styles.buttonDisabled]}
            disabled={startConversationMutation.isPending}
            onPress={() => startConversationMutation.mutate()}
          >
            {startConversationMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>💬 إرسال رسالة</Text>
            )}
          </TouchableOpacity>
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
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    marginBottom: spacing.md,
  },
  name: { ...typography.heading, color: "#fff", fontSize: 20 },
  username: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },
  idText: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: spacing.xs },
  badgesRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  body: { padding: spacing.xl, marginTop: -spacing.lg },
  levelsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, marginBottom: spacing.xl },
  bio: { color: colors.textPrimary, fontSize: 14, textAlign: "right", lineHeight: 20 },
  bioPlaceholder: { color: colors.textMuted, fontSize: 13, textAlign: "right", fontStyle: "italic" },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
