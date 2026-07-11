import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { Avatar } from "@/components/Avatar";
import { colors, gradients, radii, spacing, typography } from "@/theme";
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardRoomEntry, LeaderboardType } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "Leaderboard">;

const TYPE_TABS: { type: LeaderboardType; label: string }[] = [
  { type: "ROOM", label: "الغرفة" },
  { type: "WEALTH", label: "ثروة" },
  { type: "CHARM", label: "جاذبية" },
];

const PERIOD_PILLS: { period: LeaderboardPeriod; label: string }[] = [
  { period: "MONTH", label: "الشهر" },
  { period: "WEEK", label: "الأسبوع" },
  { period: "DAY", label: "اليوم" },
];

const PODIUM_GRADIENTS: Record<number, readonly string[]> = {
  1: gradients.orange,
  2: gradients.blue,
  3: gradients.purple,
};

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function isRoomEntry(entry: LeaderboardEntry): entry is LeaderboardRoomEntry {
  return "room" in entry;
}

function formatScore(score: number): string {
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (score >= 1_000) return `${(score / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(score));
}

function entryKey(entry: LeaderboardEntry): string {
  return isRoomEntry(entry) ? entry.room.id : entry.user.id;
}

function entryName(entry: LeaderboardEntry): string {
  return isRoomEntry(entry) ? entry.room.name : entry.user.fullName;
}

export function LeaderboardScreen({ navigation }: Props) {
  const [type, setType] = useState<LeaderboardType>("WEALTH");
  const [period, setPeriod] = useState<LeaderboardPeriod>("DAY");

  const { data: entries, isLoading } = useQuery({
    queryKey: ["leaderboard", type, period],
    queryFn: async () =>
      (
        await apiClient.get<LeaderboardEntry[]>("/leaderboard", { params: { type, period } })
      ).data,
  });

  function handlePress(entry: LeaderboardEntry) {
    if (isRoomEntry(entry)) {
      navigation.navigate("Room", { roomId: entry.room.id });
    } else {
      navigation.navigate("UserProfile", { userId: entry.user.id });
    }
  }

  const top3 = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.header as unknown as [string, string]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 التصنيف</Text>

        <View style={styles.tabsRow}>
          {TYPE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.type}
              style={[styles.tab, type === tab.type && styles.tabActive]}
              onPress={() => setType(tab.type)}
            >
              <Text style={[styles.tabText, type === tab.type && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.periodRow}>
        {PERIOD_PILLS.map((pill) => (
          <TouchableOpacity
            key={pill.period}
            style={[styles.periodPill, period === pill.period && styles.periodPillActive]}
            onPress={() => setPeriod(pill.period)}
          >
            <Text style={[styles.periodText, period === pill.period && styles.periodTextActive]}>{pill.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />}

      {!isLoading && entries?.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyText}>لا توجد نتائج بعد لهذه الفترة</Text>
        </View>
      )}

      {!isLoading && entries && entries.length > 0 && (
        <FlatList
          data={rest}
          keyExtractor={entryKey}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListHeaderComponent={
            <View style={styles.podiumRow}>
              {podiumOrder.map((entry, slot) => {
                if (!entry) return <View key={`empty-${slot}`} style={styles.podiumSlot} />;
                const rank = entry.rank;
                return (
                  <TouchableOpacity
                    key={entryKey(entry)}
                    style={[styles.podiumSlot, rank === 1 && styles.podiumSlotFirst]}
                    onPress={() => handlePress(entry)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={PODIUM_GRADIENTS[rank] as unknown as [string, string]}
                      style={styles.podiumCard}
                    >
                      <Text style={styles.podiumMedal}>{MEDALS[rank]}</Text>
                      <View style={styles.podiumAvatarRing}>
                        {isRoomEntry(entry) ? (
                          <View style={styles.podiumRoomIcon}>
                            <Text style={{ fontSize: 26 }}>🎙️</Text>
                          </View>
                        ) : (
                          <Avatar name={entry.user.fullName} imageUrl={entry.user.avatarUrl} size={56} />
                        )}
                      </View>
                      <Text style={styles.podiumName} numberOfLines={1}>
                        {entryName(entry)}
                      </Text>
                      <View style={styles.podiumLevelBadge}>
                        <Text style={styles.podiumLevelText}>Lv.{entry.level}</Text>
                      </View>
                      <Text style={styles.podiumScore}>👑 {formatScore(entry.score)}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => handlePress(item)} activeOpacity={0.7}>
              <Text style={styles.rowScore}>👑 {formatScore(item.score)}</Text>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {entryName(item)}
                </Text>
                <View style={styles.rowLevelBadge}>
                  <Text style={styles.rowLevelText}>Lv.{item.level}</Text>
                </View>
              </View>
              {isRoomEntry(item) ? (
                <View style={styles.rowRoomIcon}>
                  <Text style={{ fontSize: 18 }}>🎙️</Text>
                </View>
              ) : (
                <Avatar name={item.user.fullName} imageUrl={item.user.avatarUrl} size={40} />
              )}
              <Text style={styles.rowRank}>{item.rank}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 56, paddingBottom: spacing.lg, paddingHorizontal: spacing.xl },
  backButton: { position: "absolute", top: 52, left: spacing.lg, padding: spacing.xs, zIndex: 1 },
  backButtonText: { color: "#fff", fontSize: 32, fontWeight: "300", lineHeight: 32 },
  headerTitle: { ...typography.heading, color: "#fff", textAlign: "center", marginBottom: spacing.lg },
  tabsRow: { flexDirection: "row-reverse", justifyContent: "center", gap: spacing.sm },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill },
  tabActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabText: { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  periodRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  periodPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  periodPillActive: { backgroundColor: colors.primary },
  periodText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  periodTextActive: { color: "#fff" },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 80, paddingHorizontal: spacing.xxl },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  podiumSlot: { flex: 1, alignItems: "center" },
  podiumSlotFirst: { marginBottom: spacing.lg },
  podiumCard: {
    width: "100%",
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
  },
  podiumMedal: { fontSize: 22, marginBottom: spacing.xs },
  podiumAvatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    marginBottom: spacing.sm,
  },
  podiumRoomIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  podiumName: { color: "#fff", fontWeight: "700", fontSize: 12, marginBottom: spacing.xs },
  podiumLevelBadge: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  podiumLevelText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  podiumScore: { color: "#fff", fontWeight: "800", fontSize: 13 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowRank: { width: 24, textAlign: "center", color: colors.textMuted, fontWeight: "800" },
  rowRoomIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, alignItems: "flex-end", marginEnd: spacing.md },
  rowName: { color: colors.textPrimary, fontWeight: "700", fontSize: 14 },
  rowLevelBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    marginTop: 3,
  },
  rowLevelText: { color: colors.diamond, fontSize: 10, fontWeight: "700" },
  rowScore: { color: colors.gold, fontWeight: "800", fontSize: 13 },
});
