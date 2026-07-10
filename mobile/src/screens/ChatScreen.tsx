import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Socket } from "socket.io-client";
import { apiClient } from "@/api/client";
import { createSocket } from "@/api/socket";
import { useAuth } from "@/auth/AuthContext";
import { colors, hexToRgba, radii, spacing } from "@/theme";
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
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }) => {
          const bubbleColor = item.sender.activeBubble?.colorHex;
          return (
            <View
              style={[
                styles.bubble,
                item.senderId === user?.id ? styles.bubbleMine : styles.bubbleTheirs,
                bubbleColor && { backgroundColor: hexToRgba(bubbleColor, 0.35), borderColor: bubbleColor, borderWidth: 1 },
              ]}
            >
              {item.sender.activeBubble && (
                <Text style={styles.bubbleEmoji}>{item.sender.activeBubble.emoji}</Text>
              )}
              <Text style={styles.bubbleText}>{item.isDeleted ? "تم حذف الرسالة" : item.body}</Text>
              {item.isEdited && !item.isDeleted && <Text style={styles.editedTag}>(معدلة)</Text>}
            </View>
          );
        }}
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
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={handleChangeText}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bubble: { maxWidth: "75%", borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
  bubbleMine: { backgroundColor: colors.primary, alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleText: { color: colors.textPrimary, textAlign: "right" },
  bubbleEmoji: { fontSize: 11, textAlign: "right", marginBottom: 2 },
  editedTag: { color: "#c9cdf2", fontSize: 10, marginTop: 4, textAlign: "right" },
  typing: { color: colors.primaryLight, textAlign: "right", paddingHorizontal: spacing.lg, marginBottom: spacing.xs },
  inputRow: { flexDirection: "row-reverse", padding: spacing.md, gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlign: "right",
  },
  sendButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingHorizontal: spacing.xl, justifyContent: "center" },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: "#fff", fontWeight: "700" },
});
