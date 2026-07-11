import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import { BetAmountInput } from "@/components/BetAmountInput";
import { GameModalFrame } from "@/components/GameModalFrame";
import { GameResultBanner } from "@/components/GameResultBanner";
import type { PlayGameResult, SlotsGameSettings } from "@/api/types";

interface Props {
  visible: boolean;
  roomId: string;
  onClose: () => void;
}

const FALLBACK_SYMBOLS = ["🍒", "🍋", "🍇", "⭐", "7️⃣"];

export function SlotsGameModal({ visible, roomId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [betAmount, setBetAmount] = useState("1000");
  const [reels, setReels] = useState<string[]>(["🍒", "🍋", "🍇"]);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<PlayGameResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["slots-settings"],
    queryFn: async () => (await apiClient.get<SlotsGameSettings>("/games/slots/settings")).data,
    enabled: visible,
  });

  const symbolPool = settings?.config.tiers.flatMap((tier) => tier.label.split(" ")).filter(Boolean) ?? FALLBACK_SYMBOLS;

  function randomSymbol() {
    return symbolPool[Math.floor(Math.random() * symbolPool.length)] ?? "🍒";
  }

  function spinReels(finalSymbols: string[]): Promise<void> {
    return new Promise((resolve) => {
      const stopTimes = [700, 1100, 1500];
      const startedAt = Date.now();
      const interval = setInterval(() => {
        setReels((prev) => prev.map((symbol, index) => (Date.now() < startedAt + stopTimes[index] ? randomSymbol() : symbol)));
      }, 70);

      stopTimes.forEach((stopTime, index) => {
        setTimeout(() => {
          setReels((prev) => {
            const next = [...prev];
            next[index] = finalSymbols[index] ?? randomSymbol();
            return next;
          });
        }, stopTime);
      });

      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, stopTimes[stopTimes.length - 1] + 50);
    });
  }

  const playMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.post<PlayGameResult>("/games/slots/play", { betAmount: Number(betAmount), roomId })).data,
    onSuccess: async (data) => {
      setError(null);
      setLastResult(null);
      setSpinning(true);
      const tiers = settings?.config.tiers ?? [];
      const tierLabel = tiers[data.round.rolledNumber]?.label ?? "🍒 🍋 🍇";
      const finalSymbols = tierLabel.split(" ").filter(Boolean);
      await spinReels(finalSymbols);
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
      icon="🎰"
      title="ماكينة الحظ"
      subtitle={settings ? `الرهان بين ${settings.minBet} و ${settings.maxBet} ذهب` : undefined}
      gradientColors={["#e0507a", "#8a3ffb"]}
    >
      <BetAmountInput value={betAmount} onChange={setBetAmount} />

      <LinearGradient colors={["#3a1f5c", "#241246"]} style={styles.machine}>
        <View style={styles.reelsRow}>
          {reels.map((symbol, index) => (
            <View key={index} style={[styles.reel, !spinning && lastResult?.round.isWin && styles.reelWin]}>
              <Text style={styles.reelSymbol}>{symbol}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {playMutation.isPending && !spinning && <ActivityIndicator color={colors.primary} style={{ marginBottom: 10 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {spinning && <Text style={styles.spinningText}>جارِ التدوير...</Text>}
      {!spinning && lastResult && (
        <GameResultBanner
          isWin={lastResult.round.isWin}
          title={lastResult.round.isWin ? `فزت بمضاعف x${lastResult.round.multiplier}!` : "حظ أوفر في المرة القادمة"}
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
        <Text style={styles.buttonText}>ابدأ التدوير</Text>
      </TouchableOpacity>
    </GameModalFrame>
  );
}

const styles = StyleSheet.create({
  machine: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  reelsRow: { flexDirection: "row", justifyContent: "center", gap: spacing.md },
  reel: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.06)",
  },
  reelWin: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  reelSymbol: { fontSize: 32 },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm },
  spinningText: { color: colors.primaryLight, textAlign: "center", marginBottom: spacing.sm, fontWeight: "700" },
});
