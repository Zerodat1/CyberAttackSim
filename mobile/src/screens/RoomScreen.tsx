import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Socket } from "socket.io-client";
import { apiClient } from "@/api/client";
import { createSocket } from "@/api/socket";
import { useAuth } from "@/auth/AuthContext";
import { GiftModal } from "@/components/GiftModal";
import { DiceGameModal } from "@/components/DiceGameModal";
import type { DiceGameRound, GiftSend, RoomDetail, UserWallet } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "Room">;

interface FeedItem {
  id: string;
  text: string;
}

export function RoomScreen({ route }: Props) {
  const { roomId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [gameModalVisible, setGameModalVisible] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => (await apiClient.get<RoomDetail>(`/rooms/${roomId}`)).data,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await apiClient.get<UserWallet>("/wallet/me")).data,
    refetchInterval: 5000,
  });

  const joinMutation = useMutation({
    mutationFn: async () => apiClient.post(`/rooms/${roomId}/join`, {}),
    onSuccess: () => {
      setJoined(true);
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
    },
  });

  const takeSeatMutation = useMutation({
    mutationFn: async (seatNumber: number) => apiClient.post(`/rooms/${roomId}/seats/${seatNumber}/take`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["room", roomId] }),
  });

  const leaveSeatMutation = useMutation({
    mutationFn: async () => apiClient.post(`/rooms/${roomId}/seats/leave`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["room", roomId] }),
  });

  useEffect(() => {
    let socket: Socket;
    createSocket("rooms").then((s) => {
      socket = s;
      socketRef.current = s;
      s.on("connect", () => s.emit("room:join", { roomId }));
      s.on("room:event", () => queryClient.invalidateQueries({ queryKey: ["room", roomId] }));
      s.on("room:gift", (giftSend: GiftSend) => {
        const label = giftSend.isLucky
          ? `🎰 ${giftSend.sender.username} أرسل "${giftSend.gift.name}" لـ ${giftSend.recipient.username} (مضاعف x${giftSend.luckyMultiplier})`
          : `🎁 ${giftSend.sender.username} أرسل "${giftSend.gift.name}" لـ ${giftSend.recipient.username}`;
        setFeed((prev) => [{ id: giftSend.id, text: label }, ...prev].slice(0, 20));
      });
      s.on("room:game_round", (round: DiceGameRound) => {
        const label = round.isWin
          ? `🎲 لاعب راهن ${round.betAmount} وربح ${round.payout} (الرقم ${round.rolledNumber})`
          : `🎲 لاعب راهن ${round.betAmount} وخسر (الرقم ${round.rolledNumber})`;
        setFeed((prev) => [{ id: round.id, text: label }, ...prev].slice(0, 20));
      });
    });
    return () => {
      socket?.emit("room:leave", { roomId });
      socket?.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (room?.members.some((m) => m.userId === user?.id)) {
      setJoined(true);
    }
  }, [room, user]);

  if (isLoading || !room) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#5b4cf5" />
      </View>
    );
  }

  const mySeat = room.seats.find((s) => s.occupantId === user?.id);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{room.name}</Text>
      {wallet && <Text style={styles.walletText}>رصيدك: {wallet.goldBalance} ذهب · {wallet.diamondBalance} ألماس</Text>}

      {!joined && (
        <TouchableOpacity style={styles.button} onPress={() => joinMutation.mutate()}>
          <Text style={styles.buttonText}>الانضمام إلى الغرفة</Text>
        </TouchableOpacity>
      )}

      <View style={styles.seatsGrid}>
        {room.seats.map((seat) => (
          <TouchableOpacity
            key={seat.id}
            disabled={!joined || !!seat.occupantId || seat.isLocked}
            style={[
              styles.seat,
              seat.occupantId && styles.seatOccupied,
              seat.isLocked && styles.seatLocked,
            ]}
            onPress={() => takeSeatMutation.mutate(seat.seatNumber)}
          >
            <Text style={styles.seatNumber}>{seat.seatNumber}</Text>
            <Text style={styles.seatOccupant}>
              {seat.isLocked ? "مقفل" : seat.occupant ? seat.occupant.username : "شاغر"}
            </Text>
            {seat.isMuted && seat.occupantId && <Text style={styles.mutedIcon}>🔇</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {mySeat && (
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => leaveSeatMutation.mutate()}>
          <Text style={styles.buttonText}>مغادرة المايك</Text>
        </TouchableOpacity>
      )}

      {joined && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setGiftModalVisible(true)}>
            <Text style={styles.buttonText}>🎁 إرسال هدية</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setGameModalVisible(true)}>
            <Text style={styles.buttonText}>🎲 لعبة الرهان</Text>
          </TouchableOpacity>
        </View>
      )}

      {feed.length > 0 && (
        <View style={styles.feedBox}>
          <Text style={styles.sectionTitle}>النشاط المباشر</Text>
          {feed.map((item) => (
            <Text key={item.id} style={styles.feedItem}>
              {item.text}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>الأعضاء ({room.members.length})</Text>
      {room.members.map((member) => (
        <View key={member.id} style={styles.memberRow}>
          <Text style={styles.memberName}>{member.user.fullName}</Text>
          <Text style={styles.memberRole}>{member.role}</Text>
        </View>
      ))}

      <GiftModal
        visible={giftModalVisible}
        roomId={roomId}
        members={room.members}
        currentUserId={user?.id}
        onClose={() => setGiftModalVisible(false)}
      />
      <DiceGameModal visible={gameModalVisible} roomId={roomId} onClose={() => setGameModalVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#0f1020" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f1020" },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", textAlign: "right" },
  walletText: { color: "#f5c451", textAlign: "right", marginBottom: 16, fontSize: 13 },
  seatsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 },
  seat: {
    width: "23%",
    aspectRatio: 1,
    backgroundColor: "#1c1e3a",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  seatOccupied: { backgroundColor: "#2a2c60" },
  seatLocked: { backgroundColor: "#151626" },
  seatNumber: { color: "#7c86c9", fontSize: 10 },
  seatOccupant: { color: "#fff", fontSize: 11, marginTop: 4, textAlign: "center" },
  mutedIcon: { fontSize: 12, marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  actionButton: { flex: 1, backgroundColor: "#2a2c50", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  feedBox: { backgroundColor: "#151728", borderRadius: 12, padding: 12, marginBottom: 16 },
  feedItem: { color: "#c9cdf2", fontSize: 12, textAlign: "right", marginBottom: 6 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "right", marginVertical: 12 },
  memberRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    backgroundColor: "#1c1e3a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  memberName: { color: "#fff" },
  memberRole: { color: "#8f9bff", fontSize: 12 },
  button: { backgroundColor: "#5b4cf5", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 16 },
  buttonSecondary: {
    backgroundColor: "#2a2c50",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
