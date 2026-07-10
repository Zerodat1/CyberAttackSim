import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import { BetAmountInput } from "@/components/BetAmountInput";
import { GameModalFrame } from "@/components/GameModalFrame";
import { GameResultBanner } from "@/components/GameResultBanner";
import type { DiceGameSettings, PlayDiceResult } from "@/api/types";

interface Props {
  visible: boolean;
  roomId: string;
  onClose: () => void;
}

const NUMBERS = Array.from({ length: 10 }, (_, i) => i);

export function DiceGameModal({ visible, roomId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [betAmount, setBetAmount] = useState("50");
  const [choice, setChoice] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<PlayDiceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["dice-settings"],
    queryFn: async () => (await apiClient.get<DiceGameSettings>("/games/dice/settings")).data,
    enabled: visible,
  });

  const playMutation = useMutation({
    mutationFn: async () =>
      (
        await apiClient.post<PlayDiceResult>("/games/dice/play", {
          betAmount: Number(betAmount),
          choice,
          roomId,
        })
      ).data,
    onSuccess: (data) => {
      setLastResult(data);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر تنفيذ الرهان"),
  });

  return (
    <GameModalFrame
      visible={visible}
      onClose={onClose}
      icon="🎲"
      title="تخمين الرقم"
      subtitle={settings ? `الرهان بين ${settings.minBet} و ${settings.maxBet} — الفوز يضاعف رهانك x${settings.winMultiplier}` : undefined}
      gradientColors={[colors.primary, "#8a3ffb"]}
    >
      <BetAmountInput value={betAmount} onChange={setBetAmount} />

      <Text style={styles.label}>اختر رقمًا من 0 إلى 9</Text>
      <View style={styles.numbersRow}>
        {NUMBERS.map((n) => {
          const active = choice === n;
          return (
            <TouchableOpacity key={n} activeOpacity={0.8} onPress={() => setChoice(n)}>
              {active ? (
                <LinearGradient colors={[colors.primary, "#8a3ffb"]} style={[styles.numberChip, styles.numberChipActive]}>
                  <Text style={styles.numberText}>{n}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.numberChip}>
                  <Text style={styles.numberText}>{n}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {playMutation.isPending && <ActivityIndicator color={colors.primary} style={{ marginBottom: 10 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {lastResult && (
        <GameResultBanner
          isWin={lastResult.round.isWin}
          title={
            lastResult.round.isWin
              ? `فزت! ربحت ${lastResult.round.payout} ذهب`
              : `خسرت — الرقم كان ${lastResult.round.rolledNumber}`
          }
          subtitle={
            lastResult.round.isWin
              ? `الرقم الصحيح كان ${lastResult.round.rolledNumber} — رصيدك الآن ${lastResult.goldBalance}`
              : `رصيدك الآن: ${lastResult.goldBalance}`
          }
        />
      )}

      <TouchableOpacity
        style={[styles.button, choice === null && styles.buttonDisabled]}
        disabled={choice === null || playMutation.isPending}
        onPress={() => playMutation.mutate()}
      >
        <Text style={styles.buttonText}>راهن الآن</Text>
      </TouchableOpacity>
    </GameModalFrame>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, textAlign: "right", marginBottom: spacing.sm },
  numbersRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  numberChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  numberChipActive: {
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  numberText: { color: "#fff", fontWeight: "700" },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm },
});
