import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import { BetAmountInput } from "@/components/BetAmountInput";
import { GameModalFrame } from "@/components/GameModalFrame";
import { GameResultBanner } from "@/components/GameResultBanner";
import type { PlayGameResult, WheelGameSettings } from "@/api/types";

interface Props {
  visible: boolean;
  roomId: string;
  onClose: () => void;
}

export function WheelGameModal({ visible, roomId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [betAmount, setBetAmount] = useState("1000");
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<PlayGameResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["wheel-settings"],
    queryFn: async () => (await apiClient.get<WheelGameSettings>("/games/wheel/settings")).data,
    enabled: visible,
  });

  const segments = settings?.config.segments ?? [];

  function spinTo(finalIndex: number): Promise<void> {
    return new Promise((resolve) => {
      let tick = 0;
      const totalTicks = segments.length * 3 + finalIndex + 1;
      let delay = 70;
      function step() {
        setHighlightIndex(tick % segments.length);
        tick++;
        if (tick < totalTicks) {
          delay = Math.min(delay * 1.12, 260);
          setTimeout(step, delay);
        } else {
          setHighlightIndex(finalIndex);
          resolve();
        }
      }
      step();
    });
  }

  const playMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.post<PlayGameResult>("/games/wheel/play", { betAmount: Number(betAmount), roomId })).data,
    onSuccess: async (data) => {
      setError(null);
      setLastResult(null);
      setSpinning(true);
      await spinTo(data.round.rolledNumber);
      setSpinning(false);
      setLastResult(data);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر تنفيذ الرهان"),
  });

  return (
    <GameModalFrame
      visible={visible}
      onClose={onClose}
      icon="🎡"
      title="عجلة الحظ"
      subtitle={settings ? `الرهان بين ${settings.minBet} و ${settings.maxBet} ذهب` : undefined}
      gradientColors={["#f5c451", "#e08a1f"]}
    >
      <BetAmountInput value={betAmount} onChange={setBetAmount} />

      <View style={styles.segmentsGrid}>
        {segments.map((segment, index) => {
          const isHighlighted = highlightIndex === index;
          const content = (
            <Text style={[styles.segmentText, isHighlighted && styles.segmentTextHighlighted]}>{segment.label}</Text>
          );
          if (isHighlighted) {
            return (
              <LinearGradient
                key={index}
                colors={spinning ? ["#f5c451", "#e08a1f"] : ["#ffe08a", "#f5c451"]}
                style={[styles.segment, styles.segmentHighlighted]}
              >
                {content}
              </LinearGradient>
            );
          }
          return (
            <View key={index} style={styles.segment}>
              {content}
            </View>
          );
        })}
      </View>

      {playMutation.isPending && !spinning && <ActivityIndicator color={colors.gold} style={{ marginBottom: 10 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {spinning && <Text style={styles.spinningText}>جارِ الدوران...</Text>}
      {!spinning && lastResult && (
        <GameResultBanner
          isWin={lastResult.round.isWin}
          title={
            lastResult.round.isWin
              ? `فزت بمضاعف x${lastResult.round.multiplier}!`
              : "لم يحالفك الحظ هذه المرة"
          }
          subtitle={
            lastResult.round.isWin
              ? `ربحت ${lastResult.round.payout} ذهب — رصيدك الآن ${lastResult.goldBalance}`
              : `رصيدك الآن: ${lastResult.goldBalance}`
          }
        />
      )}

      <TouchableOpacity
        style={[styles.button, (playMutation.isPending || spinning) && styles.buttonDisabled]}
        disabled={playMutation.isPending || spinning}
        onPress={() => playMutation.mutate()}
      >
        <Text style={styles.buttonText}>أدر العجلة</Text>
      </TouchableOpacity>
    </GameModalFrame>
  );
}

const styles = StyleSheet.create({
  segmentsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  segment: {
    width: "30%",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  segmentHighlighted: {
    borderColor: "#fff",
    shadowColor: colors.gold,
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  segmentText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  segmentTextHighlighted: { color: "#3a2200" },
  button: { backgroundColor: colors.gold, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#1a1438", fontWeight: "800" },
  error: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm },
  spinningText: { color: colors.gold, textAlign: "center", marginBottom: spacing.sm, fontWeight: "700" },
});
