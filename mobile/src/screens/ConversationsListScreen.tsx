import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { Avatar } from "@/components/Avatar";
import { colors, radii, spacing } from "@/theme";
import type { ConversationSummary } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "ConversationsList">;

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${days} يوم`;
  return new Date(isoDate).toLocaleDateString("ar");
}

export function ConversationsListScreen({ navigation }: Props) {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => (await apiClient.get<ConversationSummary[]>("/messaging/conversations")).data,
    refetchInterval: 5000,
  });

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
      {!isLoading && conversations?.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>لا توجد محادثات بعد</Text>
        </View>
      )}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("Chat", { conversationId: item.id, otherUserName: item.otherUser.fullName })
            }
          >
            <Avatar name={item.otherUser.fullName} size={46} />
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                {item.isPinned && <Text style={styles.pinIcon}>📌</Text>}
                {item.isMuted && <Text style={styles.muteIcon}>🔕</Text>}
                <Text style={styles.cardTitle}>{item.otherUser.fullName}</Text>
              </View>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.lastMessage
                  ? item.lastMessage.isDeleted
                    ? "تم حذف الرسالة"
                    : item.lastMessage.body
                  : "لا توجد رسائل بعد"}
              </Text>
            </View>
            <Text style={styles.timestamp}>{relativeTime(item.updatedAt)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 80, paddingHorizontal: spacing.xxl },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardBody: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end" },
  cardTitleRow: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", textAlign: "right" },
  cardSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: "right" },
  pinIcon: { fontSize: 11 },
  muteIcon: { fontSize: 11 },
  timestamp: { color: colors.textMuted, fontSize: 11 },
});
