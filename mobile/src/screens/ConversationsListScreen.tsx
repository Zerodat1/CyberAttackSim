import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import type { ConversationSummary } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "ConversationsList">;

export function ConversationsListScreen({ navigation }: Props) {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => (await apiClient.get<ConversationSummary[]>("/messaging/conversations")).data,
    refetchInterval: 5000,
  });

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator color="#5b4cf5" style={{ marginTop: 20 }} />}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("Chat", { conversationId: item.id, otherUserName: item.otherUser.fullName })
            }
          >
            <Text style={styles.cardTitle}>{item.otherUser.fullName}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.lastMessage ? (item.lastMessage.isDeleted ? "تم حذف الرسالة" : item.lastMessage.body) : "لا توجد رسائل بعد"}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1020" },
  card: { backgroundColor: "#1c1e3a", borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "right" },
  cardSubtitle: { color: "#aab0d8", fontSize: 13, marginTop: 4, textAlign: "right" },
});
