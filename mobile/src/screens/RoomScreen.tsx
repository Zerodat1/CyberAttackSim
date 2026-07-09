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
import { Avatar } from "@/components/Avatar";
import { GiftModal } from "@/components/GiftModal";
import { DiceGameModal } from "@/components/DiceGameModal";
import { colors, radii, spacing } from "@/theme";
import type { DiceGameRound, GiftSend, RoomDetail, RoomMemberRole, UserWallet } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "Room">;

interface FeedItem {
  id: string;
  text: string;
}

const ROLE_LABEL: Record<RoomMemberRole, string> = {
  OWNER: "المالك",
  CO_OWNER: "شريك",
  ADMIN: "مشرف",
  MODERATOR: "منسّق",
  MEMBER: "عضو",
};

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
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const mySeat = room.seats.find((s) => s.occupantId === user?.id);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{room.name}</Text>
      {wallet && (
        <Text style={styles.walletText}>
          رصيدك: {wallet.goldBalance} 💰 · {wallet.diamondBalance} 💎
        </Text>
      )}

      {!joined && (
        <TouchableOpacity style={styles.button} onPress={() => joinMutation.mutate()}>
          <Text style={styles.buttonText}>الانضمام إلى الغرفة</Text>
        </TouchableOpacity>
      )}

      <View style={styles.seatsGrid}>
        {room.seats.map((seat) => (
          <View key={seat.id} style={styles.seatWrapper}>
            <TouchableOpacity
              disabled={!joined || !!seat.occupantId || seat.isLocked}
              style={[
                styles.seatCircle,
                seat.occupantId && styles.seatCircleOccupied,
                seat.isLocked && styles.seatCircleLocked,
              ]}
              onPress={() => takeSeatMutation.mutate(seat.seatNumber)}
            >
              {seat.occupant ? (
                <Avatar name={seat.occupant.username} size={56} />
              ) : (
                <Text style={styles.seatIcon}>{seat.isLocked ? "🔒" : seat.seatNumber}</Text>
              )}
              {seat.isMuted && seat.occupantId && (
                <View style={styles.mutedBadge}>
                  <Text style={styles.mutedIcon}>🔇</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.seatLabel} numberOfLines={1}>
              {seat.isLocked ? "مقفل" : seat.occupant ? seat.occupant.username : "شاغر"}
            </Text>
          </View>
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
          <View style={styles.memberRoleBadge}>
            <Text style={styles.memberRole}>{ROLE_LABEL[member.role]}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.user.fullName}</Text>
            <Text style={styles.memberUsername}>@{member.user.username}</Text>
          </View>
          <Avatar name={member.user.username} size={36} />
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
  container: { flexGrow: 1, padding: spacing.xl, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, textAlign: "right" },
  walletText: { color: colors.gold, textAlign: "right", marginBottom: spacing.lg, fontSize: 13, fontWeight: "600" },
  seatsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: spacing.lg },
  seatWrapper: { width: "23%", alignItems: "center", marginBottom: spacing.lg },
  seatCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.06)",
  },
  seatCircleOccupied: { backgroundColor: colors.surfaceMuted, borderColor: colors.primary },
  seatCircleLocked: { backgroundColor: colors.surfaceAlt, borderColor: "transparent" },
  seatIcon: { color: colors.textMuted, fontSize: 16, fontWeight: "700" },
  seatLabel: { color: colors.textPrimary, fontSize: 11, marginTop: spacing.xs, textAlign: "center", maxWidth: "100%" },
  mutedBadge: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  mutedIcon: { fontSize: 11 },
  actionsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  actionButton: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  feedBox: { backgroundColor: colors.surfaceAlt, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg },
  feedItem: { color: "#c9cdf2", fontSize: 12, textAlign: "right", marginBottom: spacing.xs },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", textAlign: "right", marginVertical: spacing.md },
  memberRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberInfo: { flex: 1, marginEnd: spacing.md, alignItems: "flex-end" },
  memberName: { color: colors.textPrimary, fontWeight: "600" },
  memberUsername: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  memberRoleBadge: {
    backgroundColor: "rgba(91, 76, 245, 0.15)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  memberRole: { color: colors.primaryLight, fontSize: 11, fontWeight: "700" },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: "center", marginBottom: spacing.lg },
  buttonSecondary: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
