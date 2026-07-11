import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "@/components/Avatar";
import { colors, radii, spacing } from "@/theme";
import type { RoomChatMessage } from "@/api/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  messages: RoomChatMessage[];
  currentUserId?: string;
  canModerate: boolean;
  onSend: (text: string) => void;
  onDelete: (messageId: string) => void;
}

export function RoomChatModal({ visible, onClose, messages, currentUserId, canModerate, onSend, onDelete }: Props) {
  const [text, setText] = useState("");

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>الدردشة</Text>
            <View style={{ width: 20 }} />
          </View>

          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={{ paddingVertical: spacing.md }}
            inverted={false}
            renderItem={({ item }) => {
              const canDelete = canModerate || item.sender.id === currentUserId;
              return (
                <View style={styles.messageRow}>
                  <Avatar name={item.sender.username} imageUrl={item.sender.avatarUrl} size={32} />
                  <View style={styles.messageBubble}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.senderName} numberOfLines={1}>
                        {item.sender.username}
                      </Text>
                      {canDelete && (
                        <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
                          <Text style={styles.deleteIcon}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.messageText}>{item.text}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>لا توجد رسائل بعد، ابدأ الدردشة!</Text>}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="اكتب رسالة..."
              placeholderTextColor={colors.textMuted}
              maxLength={500}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
              disabled={!text.trim()}
              onPress={handleSend}
            >
              <Text style={styles.sendButtonText}>إرسال</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    height: "70%",
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  closeIcon: { color: colors.textMuted, fontSize: 16 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  list: { flex: 1, paddingHorizontal: spacing.lg },
  emptyText: { color: colors.textMuted, textAlign: "center", paddingVertical: spacing.xxl },
  messageRow: { flexDirection: "row-reverse", gap: spacing.sm, marginBottom: spacing.md, alignItems: "flex-start" },
  messageBubble: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  senderName: { color: colors.primaryLight, fontSize: 12, fontWeight: "700" },
  deleteIcon: { fontSize: 13 },
  messageText: { color: colors.textPrimary, textAlign: "right", fontSize: 14, lineHeight: 19 },
  inputRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    textAlign: "right",
  },
  sendButton: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
