import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Socket } from "socket.io-client";
import { apiClient } from "@/api/client";
import { createSocket } from "@/api/socket";
import { useAuth } from "@/auth/AuthContext";
import type { ChatMessage } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "Chat">;

export function ChatScreen({ route }: Props) {
  const { conversationId, otherUserName } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [draft, setDraft] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);

  const { data: messages } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () =>
      (await apiClient.get<ChatMessage[]>(`/messaging/conversations/${conversationId}/messages`)).data,
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) =>
      apiClient.post(`/messaging/conversations/${conversationId}/messages`, { body }),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });

  useEffect(() => {
    let socket: Socket;
    createSocket("messaging").then((s) => {
      socket = s;
      socketRef.current = s;
      s.on("message:new", (message: ChatMessage) => {
        if (message.conversationId === conversationId) {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      });
      s.on("typing", (data: { conversationId: string }) => {
        if (data.conversationId === conversationId) {
          setOtherTyping(true);
          setTimeout(() => setOtherTyping(false), 2000);
        }
      });
    });
    return () => {
      socket?.disconnect();
    };
  }, [conversationId]);

  function handleChangeText(text: string) {
    setDraft(text);
    socketRef.current?.emit("typing", { conversationId, recipientId: otherUserId() });
  }

  function otherUserId(): string | undefined {
    const anyOther = messages?.find((m) => m.senderId !== user?.id);
    return anyOther?.senderId;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={[...(messages ?? [])].reverse()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.senderId === user?.id ? styles.bubbleMine : styles.bubbleTheirs,
            ]}
          >
            <Text style={styles.bubbleText}>{item.isDeleted ? "تم حذف الرسالة" : item.body}</Text>
            {item.isEdited && !item.isDeleted && <Text style={styles.editedTag}>(معدلة)</Text>}
          </View>
        )}
      />
      {otherTyping && <Text style={styles.typing}>{otherUserName} يكتب الآن...</Text>}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.sendButton, !draft && styles.sendButtonDisabled]}
          disabled={!draft}
          onPress={() => sendMutation.mutate(draft)}
        >
          <Text style={styles.sendButtonText}>إرسال</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="اكتب رسالة..."
          value={draft}
          onChangeText={handleChangeText}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1020" },
  bubble: { maxWidth: "75%", borderRadius: 14, padding: 12, marginBottom: 10 },
  bubbleMine: { backgroundColor: "#5b4cf5", alignSelf: "flex-start" },
  bubbleTheirs: { backgroundColor: "#1c1e3a", alignSelf: "flex-end" },
  bubbleText: { color: "#fff", textAlign: "right" },
  editedTag: { color: "#c9cdf2", fontSize: 10, marginTop: 4, textAlign: "right" },
  typing: { color: "#8f9bff", textAlign: "right", paddingHorizontal: 16, marginBottom: 4 },
  inputRow: { flexDirection: "row-reverse", padding: 12, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#1c1e3a",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: "right",
  },
  sendButton: { backgroundColor: "#5b4cf5", borderRadius: 12, paddingHorizontal: 18, justifyContent: "center" },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: "#fff", fontWeight: "700" },
});
