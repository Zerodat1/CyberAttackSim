import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Socket } from "socket.io-client";
import { apiClient } from "@/api/client";
import { createSocket } from "@/api/socket";
import { useAuth } from "@/auth/AuthContext";
import { Avatar } from "@/components/Avatar";
import { GiftModal } from "@/components/GiftModal";
import { GamesHubModal } from "@/components/GamesHubModal";
import { RoomSettingsModal } from "@/components/RoomSettingsModal";
import { colorForName, colors, hexToRgba, radii, spacing } from "@/theme";
import type { GameRound, GameType, GiftSend, RoomDetail, RoomMemberRole, RoomSeat, UserWallet } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

const GAME_ICON: Record<GameType, string> = {
  DICE_GUESS: "🎲",
  LUCKY_WHEEL: "🎡",
  SLOT_MACHINE: "🎰",
  CRASH_GUESS: "🚀",
};

const ROOM_ROLE_RANK: Record<RoomMemberRole, number> = {
  OWNER: 4,
  CO_OWNER: 3,
  ADMIN: 2,
  MODERATOR: 1,
  MEMBER: 0,
};

type Props = NativeStackScreenProps<AppStackParamList, "Room">;

interface FeedItem {
  id: string;
  text: string;
  kind: "gift" | "game";
}

const ROLE_LABEL: Record<RoomMemberRole, string> = {
  OWNER: "المالك",
  CO_OWNER: "شريك",
  ADMIN: "مشرف",
  MODERATOR: "منسّق",
  MEMBER: "عضو",
};

export function RoomScreen({ route, navigation }: Props) {
  const { roomId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [gameModalVisible, setGameModalVisible] = useState(false);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [deafened, setDeafened] = useState(false);
  const deafenedRef = useRef(false);

  useEffect(() => {
    deafenedRef.current = deafened;
  }, [deafened]);

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

  const toggleMicMutation = useMutation({
    mutationFn: async ({ seatNumber, muted }: { seatNumber: number; muted: boolean }) =>
      apiClient.patch(`/rooms/${roomId}/seats/${seatNumber}/mute`, { muted }),
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
        if (deafenedRef.current) return;
        const label = giftSend.isLucky
          ? `🎰 ${giftSend.sender.username} أرسل "${giftSend.gift.name}" لـ ${giftSend.recipient.username} (مضاعف x${giftSend.luckyMultiplier})`
          : `🎁 ${giftSend.sender.username} أرسل "${giftSend.gift.name}" لـ ${giftSend.recipient.username}`;
        setFeed((prev) => [{ id: giftSend.id, text: label, kind: "gift" as const }, ...prev].slice(0, 20));
      });
      s.on("room:game_round", (round: GameRound) => {
        if (deafenedRef.current) return;
        const icon = GAME_ICON[round.gameType] ?? "🎮";
        const label = round.isWin
          ? `${icon} لاعب راهن ${round.betAmount} وربح ${round.payout}`
          : `${icon} لاعب راهن ${round.betAmount} وخسر`;
        setFeed((prev) => [{ id: round.id, text: label, kind: "game" as const }, ...prev].slice(0, 20));
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

  const accentColor = colorForName(room.name);
  const mySeat = room.seats.find((s) => s.occupantId === user?.id);
  const myMembership = room.members.find((m) => m.userId === user?.id);
  const canManageRoom = myMembership ? ROOM_ROLE_RANK[myMembership.role] >= ROOM_ROLE_RANK.ADMIN : false;
  const sortedSeats = [...room.seats].sort((a, b) => a.seatNumber - b.seatNumber);
  const vipSeats = sortedSeats.slice(0, 4);
  const restSeats = sortedSeats.slice(4);
  const visibleMembers = room.members.slice(0, 5);
  const extraMemberCount = room.members.length - visibleMembers.length;

  function renderSeat(seat: RoomSeat, isVip: boolean) {
    const isOwnerSeat = isVip && seat.seatNumber === 1 && !!seat.occupant;
    return (
      <View key={seat.id} style={styles.seatWrapper}>
        {isOwnerSeat && <Text style={styles.crown}>👑</Text>}
        <TouchableOpacity
          disabled={!joined || !!seat.occupantId || seat.isLocked}
          style={[
            styles.seatCircle,
            isVip && styles.seatCircleVip,
            seat.occupantId && (isOwnerSeat ? styles.seatCircleOwner : styles.seatCircleOccupied),
            seat.isLocked && styles.seatCircleLocked,
          ]}
          onPress={() => takeSeatMutation.mutate(seat.seatNumber)}
        >
          {seat.occupant ? (
            <Avatar name={seat.occupant.username} size={isVip ? 60 : 52} />
          ) : (
            <Text style={styles.seatIcon}>{seat.isLocked ? "🔒" : "🛋️"}</Text>
          )}
          {seat.isMuted && seat.occupantId && (
            <View style={styles.mutedBadge}>
              <Text style={styles.mutedIcon}>🔇</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.seatLabel} numberOfLines={1}>
          {seat.isLocked ? "مقفل" : seat.occupant ? seat.occupant.username : `شاغر ${seat.seatNumber}`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#3a1f6e", "#1a1438", "#0a0a1a"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowTop, { backgroundColor: hexToRgba(accentColor, 0.28) }]} />
      <View style={styles.glowBottom} />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Text style={styles.iconButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.roomIdentity}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room.name}
          </Text>
          <Text style={styles.roomId}>ID: {room.id.slice(0, 8)}</Text>
        </View>
        {wallet && (
          <View style={styles.walletPill}>
            <Text style={styles.walletPillText}>{wallet.goldBalance} 💰</Text>
            <Text style={styles.walletPillDivider}>·</Text>
            <Text style={[styles.walletPillText, { color: colors.diamond }]}>{wallet.diamondBalance} 💎</Text>
          </View>
        )}
        {canManageRoom && (
          <TouchableOpacity style={styles.iconButton} onPress={() => setSettingsModalVisible(true)}>
            <Text style={styles.iconButtonText}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.watermark} numberOfLines={1}>
        {room.name}
      </Text>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.stagePanel, { borderColor: hexToRgba(accentColor, 0.25) }]}>
          <View style={[styles.stageGlow, { backgroundColor: hexToRgba(accentColor, 0.14) }]} />
          <View style={styles.seatsRow}>{vipSeats.map((seat) => renderSeat(seat, true))}</View>
          {restSeats.length > 0 && <View style={styles.seatsRow}>{restSeats.map((seat) => renderSeat(seat, false))}</View>}
        </View>

        <TouchableOpacity style={styles.membersStrip} onPress={() => setMembersModalVisible(true)}>
          <View style={styles.membersAvatars}>
            {visibleMembers.map((member, index) => (
              <View key={member.id} style={[styles.memberAvatarOverlap, { marginStart: index === 0 ? 0 : -12 }]}>
                <Avatar name={member.user.username} imageUrl={member.user.avatarUrl} size={28} />
              </View>
            ))}
            {extraMemberCount > 0 && (
              <View style={[styles.memberAvatarOverlap, styles.memberExtraBubble, { marginStart: -12 }]}>
                <Text style={styles.memberExtraText}>+{extraMemberCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.membersCount}>الأعضاء ({room.members.length})</Text>
        </TouchableOpacity>

        {feed.length > 0 && (
          <View style={styles.feedBox}>
            {feed.slice(0, 5).map((item) => (
              <View
                key={item.id}
                style={[
                  styles.feedBubble,
                  { borderStartColor: item.kind === "gift" ? colors.gold : colors.primaryLight },
                ]}
              >
                <Text style={styles.feedText}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        {!joined ? (
          <TouchableOpacity style={styles.joinButton} onPress={() => joinMutation.mutate()}>
            <Text style={styles.joinButtonText}>الانضمام إلى الغرفة</Text>
          </TouchableOpacity>
        ) : (
          <>
            {mySeat && (
              <TouchableOpacity
                style={[styles.bottomIconButton, mySeat.isMuted && styles.bottomIconButtonActive]}
                onPress={() => toggleMicMutation.mutate({ seatNumber: mySeat.seatNumber, muted: !mySeat.isMuted })}
              >
                <Text style={styles.bottomIconText}>{mySeat.isMuted ? "🔇" : "🎙️"}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.bottomIconButton, deafened && styles.bottomIconButtonActive]}
              onPress={() => setDeafened((d) => !d)}
            >
              <Text style={styles.bottomIconText}>{deafened ? "🔈" : "🔊"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIconButton} onPress={() => setGiftModalVisible(true)}>
              <Text style={styles.bottomIconText}>🎁</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIconButton} onPress={() => setGameModalVisible(true)}>
              <Text style={styles.bottomIconText}>🎲</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIconButton} onPress={() => setMembersModalVisible(true)}>
              <Text style={styles.bottomIconText}>👥</Text>
            </TouchableOpacity>
            {mySeat && (
              <TouchableOpacity style={styles.leaveSeatButton} onPress={() => leaveSeatMutation.mutate()}>
                <Text style={styles.joinButtonText}>مغادرة المايك</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <Modal visible={membersModalVisible} transparent animationType="slide" onRequestClose={() => setMembersModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>الأعضاء ({room.members.length})</Text>
            <ScrollView>
              {room.members.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberRoleBadge}>
                    <Text style={styles.memberRole}>{ROLE_LABEL[member.role]}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.user.fullName}</Text>
                    <Text style={styles.memberUsername}>@{member.user.username}</Text>
                  </View>
                  <Avatar name={member.user.username} imageUrl={member.user.avatarUrl} size={36} />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setMembersModalVisible(false)}>
              <Text style={styles.joinButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <GiftModal
        visible={giftModalVisible}
        roomId={roomId}
        members={room.members}
        currentUserId={user?.id}
        onClose={() => setGiftModalVisible(false)}
      />
      <GamesHubModal visible={gameModalVisible} roomId={roomId} onClose={() => setGameModalVisible(false)} />
      <RoomSettingsModal
        visible={settingsModalVisible}
        room={room}
        isOwner={myMembership?.role === "OWNER"}
        onClose={() => setSettingsModalVisible(false)}
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  glowTop: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(124, 108, 249, 0.25)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -100,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(245, 196, 81, 0.08)",
  },
  topBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: { color: "#fff", fontSize: 26, fontWeight: "300", lineHeight: 26 },
  roomIdentity: { flex: 1, marginHorizontal: spacing.md, alignItems: "flex-end" },
  roomName: { color: "#fff", fontSize: 16, fontWeight: "800" },
  roomId: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
  walletPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    gap: 6,
  },
  walletPillText: { color: colors.gold, fontSize: 12, fontWeight: "700" },
  walletPillDivider: { color: "rgba(255,255,255,0.3)", fontSize: 12 },
  watermark: {
    position: "absolute",
    top: "30%",
    alignSelf: "center",
    color: "rgba(255,255,255,0.06)",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 4,
    textShadowColor: "rgba(255,255,255,0.08)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  stagePanel: {
    borderRadius: radii.xl,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  stageGlow: {
    position: "absolute",
    top: -40,
    alignSelf: "center",
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  seatsRow: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "space-between", marginBottom: spacing.lg },
  seatWrapper: { width: "23%", alignItems: "center", marginBottom: spacing.md },
  crown: { fontSize: 16, marginBottom: -6, zIndex: 1 },
  seatCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  seatCircleVip: { width: 68, height: 68, borderRadius: 34 },
  seatCircleOccupied: { backgroundColor: "rgba(91,76,245,0.2)", borderColor: colors.primaryLight },
  seatCircleOwner: { backgroundColor: "rgba(245,196,81,0.15)", borderColor: colors.gold, borderWidth: 3 },
  seatCircleLocked: { backgroundColor: "rgba(0,0,0,0.3)", borderColor: "transparent" },
  seatIcon: { fontSize: 20 },
  seatLabel: { color: "#e4e6ff", fontSize: 11, marginTop: spacing.xs, textAlign: "center", maxWidth: "100%" },
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
  membersStrip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.lg,
  },
  membersAvatars: { flexDirection: "row-reverse", alignItems: "center", marginStart: spacing.sm },
  memberAvatarOverlap: { borderWidth: 2, borderColor: "#1a1438", borderRadius: 16 },
  memberExtraBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  memberExtraText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  membersCount: { color: "#e4e6ff", fontSize: 12, fontWeight: "600" },
  feedBox: { marginTop: spacing.sm },
  feedBubble: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: radii.md,
    borderStartWidth: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    alignSelf: "flex-end",
    maxWidth: "100%",
  },
  feedText: { color: "#e4e6ff", fontSize: 12, textAlign: "right" },
  bottomBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  bottomIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomIconButtonActive: { backgroundColor: "rgba(255,107,107,0.25)" },
  bottomIconText: { fontSize: 22 },
  joinButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  leaveSeatButton: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  joinButtonText: { color: "#fff", fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    maxHeight: "70%",
  },
  modalTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", textAlign: "right", marginBottom: spacing.md },
  modalCloseButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  memberRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
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
});
