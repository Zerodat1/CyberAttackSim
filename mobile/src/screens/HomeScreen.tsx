import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<RechargeAgencyApplication>("/recharge-agency/applications/me");
        return data;
      } catch {
        return null;
      }
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await apiClient.get<UserWallet>("/wallet/me")).data,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => navigation.navigate("Profile")}>
        <Avatar name={user?.fullName ?? "?"} imageUrl={user?.avatarUrl} size={52} />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>مرحبًا، {user?.fullName}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
        </View>
      </TouchableOpacity>

      {wallet && (
        <View style={styles.walletCard}>
          <View style={styles.walletItem}>
            <Text style={styles.walletValue}>{wallet.goldBalance}</Text>
            <Text style={styles.walletLabel}>ذهب 💰</Text>
          </View>
          <View style={styles.walletDivider} />
          <View style={styles.walletItem}>
            <Text style={[styles.walletValue, { color: colors.diamond }]}>{wallet.diamondBalance}</Text>
            <Text style={styles.walletLabel}>ألماس 💎</Text>
          </View>
        </View>
      )}

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("RoomsList")}>
          <Text style={styles.navCardIcon}>🎙️</Text>
          <Text style={styles.navCardText}>الغرف الصوتية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("ConversationsList")}>
          <Text style={styles.navCardIcon}>💬</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xxl, backgroundColor: colors.background },
  header: { flexDirection: "row-reverse", alignItems: "center", marginBottom: spacing.xl },
  headerText: { marginEnd: spacing.md, alignItems: "flex-end" },
  greeting: { ...typography.heading, color: colors.textPrimary, textAlign: "right" },
  username: { ...typography.caption, color: colors.textSecondary, textAlign: "right", marginTop: 2 },
  walletCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
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
  navCardIcon: { fontSize: 22, marginBottom: 4 },
  navCardText: { color: colors.textPrimary, fontWeight: "700", fontSize: 13 },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl, marginBottom: spacing.xl },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "600", textAlign: "right", marginBottom: spacing.md },
  notes: { color: colors.textSecondary, textAlign: "right", marginBottom: spacing.md },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  logout: { alignItems: "center", marginTop: "auto", paddingVertical: spacing.md },
  logoutText: { color: colors.danger },
});
