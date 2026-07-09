import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiClient } from "@/api/client";
import type { Gift, RoomMember } from "@/api/types";

interface Props {
  visible: boolean;
  roomId: string;
  members: RoomMember[];
  currentUserId?: string;
  onClose: () => void;
}

export function GiftModal({ visible, roomId, members, currentUserId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [giftId, setGiftId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: gifts, isLoading } = useQuery({
    queryKey: ["gifts-catalog"],
    queryFn: async () => (await apiClient.get<Gift[]>("/gifts")).data,
    enabled: visible,
  });

  const sendMutation = useMutation({
    mutationFn: async () =>
      apiClient.post("/gifts/send", {
        recipientId,
        giftId,
        quantity: Number(quantity) || 1,
        roomId,
      }),
    onSuccess: () => {
      setSuccess("تم إرسال الهدية بنجاح");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر إرسال الهدية"),
  });

  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>إرسال هدية</Text>

          <Text style={styles.label}>إلى</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {otherMembers.map((member) => (
              <TouchableOpacity
                key={member.userId}
                style={[styles.chip, recipientId === member.userId && styles.chipActive]}
                onPress={() => setRecipientId(member.userId)}
              >
                <Text style={styles.chipText}>{member.user.username}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>الهدية</Text>
          {isLoading && <ActivityIndicator color="#5b4cf5" />}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {gifts?.map((gift) => (
              <TouchableOpacity
                key={gift.id}
                style={[styles.chip, giftId === gift.id && styles.chipActive]}
                onPress={() => setGiftId(gift.id)}
              >
                <Text style={styles.chipText}>
                  {gift.name} ({gift.price}💰){gift.type === "LUCKY" ? " 🎰" : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>الكمية</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {success && <Text style={styles.success}>{success}</Text>}

          <TouchableOpacity
            style={[styles.button, (!recipientId || !giftId) && styles.buttonDisabled]}
            disabled={!recipientId || !giftId || sendMutation.isPending}
            onPress={() => sendMutation.mutate()}
          >
            <Text style={styles.buttonText}>إرسال</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={onClose}>
            <Text style={styles.buttonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  card: { backgroundColor: "#1c1e3a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "right", marginBottom: 16 },
  label: { color: "#aab0d8", textAlign: "right", marginBottom: 6 },
  chip: { backgroundColor: "#2a2c50", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginEnd: 8 },
  chipActive: { backgroundColor: "#5b4cf5" },
  chipText: { color: "#fff" },
  input: {
    backgroundColor: "#0f1020",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    textAlign: "right",
  },
  button: { backgroundColor: "#5b4cf5", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  buttonSecondary: { backgroundColor: "#2a2c50", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#ff6b6b", textAlign: "center", marginBottom: 8 },
  success: { color: "#4cd964", textAlign: "center", marginBottom: 8 },
});
