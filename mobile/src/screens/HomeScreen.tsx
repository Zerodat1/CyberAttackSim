import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import type { RechargeAgencyApplication } from "@/api/types";
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>مرحبًا، {user?.fullName}</Text>
      <Text style={styles.username}>@{user?.username}</Text>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("RoomsList")}>
          <Text style={styles.navCardText}>الغرف الصوتية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate("ConversationsList")}>
          <Text style={styles.navCardText}>الرسائل</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {isLoading && <ActivityIndicator color="#5b4cf5" />}
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
  container: { flexGrow: 1, padding: 24, backgroundColor: "#0f1020" },
  greeting: { fontSize: 22, fontWeight: "700", color: "#fff", textAlign: "right" },
  username: { fontSize: 14, color: "#aab0d8", textAlign: "right", marginBottom: 24 },
  navRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  navCard: { flex: 1, backgroundColor: "#1c1e3a", borderRadius: 14, paddingVertical: 18, alignItems: "center" },
  navCardText: { color: "#fff", fontWeight: "700" },
  card: { backgroundColor: "#1c1e3a", borderRadius: 16, padding: 20, marginBottom: 20 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "right", marginBottom: 12 },
  notes: { color: "#aab0d8", textAlign: "right", marginBottom: 12 },
  button: { backgroundColor: "#5b4cf5", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  logout: { alignItems: "center", marginTop: "auto", paddingVertical: 12 },
  logoutText: { color: "#ff6b6b" },
});
