import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Avatar } from "@/components/Avatar";
import { colors, radii, spacing, typography } from "@/theme";
import type { RechargeAgencyApplication, UserWallet } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبولة",
  REJECTED: "مرفوضة",
  CHANGES_REQUESTED: "بانتظار تعديل البيانات",
  SUSPENDED: "معلّقة",
};

export function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const { data: application, isLoading } = useQuery({
    queryKey: ["my-application"],
    queryFn: async () =>
      (await apiClient.get<RechargeAgencyApplication | null>("/recharge-agency/applications/me")).data,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await apiClient.get<UserWallet>("/wallet/me")).data,
  });

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.primary, "#8a3ffb"]} style={styles.header}>
        <TouchableOpacity style={styles.headerRow} onPress={() => navigation.navigate("Profile")}>
          <Avatar name={user?.fullName ?? "?"} imageUrl={user?.avatarUrl} size={52} />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>مرحبًا، {user?.fullName}</Text>
            <Text style={styles.username}>@{user?.username}</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("RoomsList")}>
            <View style={[styles.navCardIconWrap, { backgroundColor: "rgba(91,76,245,0.18)" }]}>
              <Text style={styles.navCardIcon}>🎙️</Text>
            </View>
            <Text style={styles.navCardText}>الغرف الصوتية</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("ConversationsList")}>
            <View style={[styles.navCardIconWrap, { backgroundColor: "rgba(127,216,232,0.18)" }]}>
              <Text style={styles.navCardIcon}>💬</Text>
            </View>
            <Text style={styles.navCardText}>الرسائل</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {isLoading && <ActivityIndicator color={colors.primary} />}
          {!isLoading && !application && (
            <>
              <Text style={styles.cardTitle}>لست وكيل شحن بعد</Text>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ApplyAgency")}>
                <Text style={styles.buttonText}>التقديم لفتح وكالة شحن</Text>
              </TouchableOpacity>
            </>
          )}
          {application && application.status !== "APPROVED" && (
            <>
              <Text style={styles.cardTitle}>حالة طلب الوكالة: {STATUS_LABEL[application.status]}</Text>
              {application.reviewNotes && <Text style={styles.notes}>{application.reviewNotes}</Text>}
              {application.status === "CHANGES_REQUESTED" && (
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ApplyAgency")}>
                  <Text style={styles.buttonText}>تعديل الطلب وإعادة الإرسال</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {application?.status === "APPROVED" && (
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("AgentDashboard")}>
              <Text style={styles.buttonText}>الذهاب إلى لوحة وكالة الشحن</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.logout} onPress={() => logout()}>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 56, paddingBottom: spacing.xxl, paddingHorizontal: spacing.xxl },
  headerRow: { flexDirection: "row-reverse", alignItems: "center" },
  headerText: { marginEnd: spacing.md, alignItems: "flex-end" },
  greeting: { ...typography.heading, color: "#fff", textAlign: "right" },
  username: { ...typography.caption, color: "rgba(255,255,255,0.75)", textAlign: "right", marginTop: 2 },
  container: { flexGrow: 1, padding: spacing.xxl, marginTop: -spacing.lg },
  walletCard: {
    flexDirection: "row",
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    justifyContent: "space-around",
    alignItems: "center",
  },
  walletItem: { alignItems: "center", flex: 1 },
  walletDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.08)" },
  walletValue: { color: colors.gold, fontSize: 20, fontWeight: "800" },
  walletLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  navRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
  navCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  navCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  navCardIcon: { fontSize: 22 },
  navCardText: { color: colors.textPrimary, fontWeight: "700", fontSize: 13 },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl, marginBottom: spacing.xl },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "600", textAlign: "right", marginBottom: spacing.md },
  notes: { color: colors.textSecondary, textAlign: "right", marginBottom: spacing.md },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  logout: { alignItems: "center", paddingVertical: spacing.md },
  logoutText: { color: colors.danger },
});
