import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import type { RoomSummary } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "RoomsList">;

export function RoomsListScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => (await apiClient.get<RoomSummary[]>("/rooms")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => (await apiClient.post("/rooms", { name: newRoomName })).data,
    onSuccess: (room: RoomSummary) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setCreating(false);
      setNewRoomName("");
      navigation.navigate("Room", { roomId: room.id });
    },
  });

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator color="#5b4cf5" style={{ marginTop: 20 }} />}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Room", { roomId: item.id })}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {item.owner.fullName} · {item._count.members} عضو {item.isPasswordProtected ? "· مغلقة" : ""}
            </Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setCreating(true)}>
        <Text style={styles.fabText}>+ غرفة جديدة</Text>
      </TouchableOpacity>

      <Modal visible={creating} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>إنشاء غرفة صوتية</Text>
            <TextInput
              style={styles.input}
              placeholder="اسم الغرفة"
              value={newRoomName}
              onChangeText={setNewRoomName}
            />
            <View style={{ flexDirection: "row-reverse", gap: 10 }}>
              <TouchableOpacity
                style={[styles.button, !newRoomName && styles.buttonDisabled]}
                disabled={!newRoomName}
                onPress={() => createMutation.mutate()}
              >
                <Text style={styles.buttonText}>إنشاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => setCreating(false)}>
                <Text style={styles.buttonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1020" },
  card: { backgroundColor: "#1c1e3a", borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "right" },
  cardSubtitle: { color: "#aab0d8", fontSize: 12, marginTop: 4, textAlign: "right" },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: "#5b4cf5",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  fabText: { color: "#fff", fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "#1c1e3a", borderRadius: 16, padding: 20 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "right", marginBottom: 16 },
  input: {
    backgroundColor: "#0f1020",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    textAlign: "right",
  },
  button: { backgroundColor: "#5b4cf5", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  buttonSecondary: { backgroundColor: "#2a2c50", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
