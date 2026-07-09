import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import { BetAmountInput } from "@/components/BetAmountInput";
import { GameModalFrame } from "@/components/GameModalFrame";
import type { CrashGameSettings, PlayGameResult } from "@/api/types";

interface Props {
  visible: boolean;
  roomId: string;
  onClose: () => void;
}

const TARGET_PRESETS = [1.5, 2, 3, 5, 10];

export function CrashGameModal({ visible, roomId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [betAmount, setBetAmount] = useState("50");
  const [target, setTarget] = useState(2);
  const [liveMultiplier, setLiveMultiplier] = useState(1);
  const [running, setRunning] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [lastResult, setLastResult] = useState<PlayGameResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["crash-settings"],
    queryFn: async () => (await apiClient.get<CrashGameSettings>("/games/crash/settings")).data,
    enabled: visible,
  });

  function runAnimation(finalPoint: number, isWin: boolean): Promise<void> {
    return new Promise((resolve) => {
      const durationMs = 1600;
      const steps = 40;
      const stepDelay = durationMs / steps;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        const value = 1 + (finalPoint - 1) * progress;
        setLiveMultiplier(Math.min(value, finalPoint));
        if (step >= steps) {
          clearInterval(interval);
          setLiveMultiplier(finalPoint);
          if (!isWin) setCrashed(true);
          resolve();
        }
      }, stepDelay);
    });
  }

  const playMutation = useMutation({
    mutationFn: async () =>
      (
        await apiClient.post<PlayGameResult>("/games/crash/play", {
          betAmount: Number(betAmount),
          targetMultiplier: target,
          roomId,
        })
      ).data,
    onSuccess: async (data) => {
      setError(null);
      setLastResult(null);
      setCrashed(false);
      setRunning(true);
      setLiveMultiplier(1);
      const crashPoint = data.round.rolledNumber / 100;
      const isWin = data.round.isWin;
      const endPoint = isWin ? target : crashPoint;
      await runAnimation(endPoint, isWin);
      setRunning(false);
      setLastResult(data);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر تنفيذ الرهان"),
  });

  return (
    <GameModalFrame
      visible={visible}
      onClose={onClose}
      icon="🚀"
      title="الصاروخ"
      subtitle={settings ? `اختر مضاعف السحب التلقائي — الرهان بين ${settings.minBet} و ${settings.maxBet} ذهب` : undefined}
      gradientColors={["#0984e3", "#00cec9"]}
    >
      <BetAmountInput value={betAmount} onChange={setBetAmount} />

      <Text style={styles.label}>اسحب عند مضاعف</Text>
      <View style={styles.targetsRow}>
        {TARGET_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.targetChip, target === preset && styles.targetChipActive]}
            onPress={() => setTarget(preset)}
          >
            <Text style={styles.targetChipText}>x{preset}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.multiplierBox, crashed && styles.multiplierBoxCrashed]}>
        <Text style={[styles.multiplierText, crashed && styles.multiplierTextCrashed]}>
          x{liveMultiplier.toFixed(2)}
        </Text>
        {running && !crashed && <Text style={styles.runningHint}>جارِ الصعود...</Text>}
        {crashed && <Text style={styles.crashedHint}>انفجر الصاروخ!</Text>}
      </View>

      {playMutation.isPending && !running && <ActivityIndicator color={colors.diamond} style={{ marginBottom: 10 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!running && lastResult && (
        <Text style={lastResult.round.isWin ? styles.win : styles.lose}>
          {lastResult.round.isWin
            ? `سحبت عند x${target} — ربحت ${lastResult.round.payout} ذهب`
            : `انفجر الصاروخ قبل أن تصل — خسرت الرهان`}
          {" — رصيدك الآن: "}
          {lastResult.goldBalance}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, (playMutation.isPending || running) && styles.buttonDisabled]}
        disabled={playMutation.isPending || running}
        onPress={() => playMutation.mutate()}
      >
        <Text style={styles.buttonText}>إطلاق الصاروخ</Text>
      </TouchableOpacity>
    </GameModalFrame>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, textAlign: "right", marginBottom: spacing.sm },
  targetsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  targetChip: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  targetChipActive: { backgroundColor: colors.diamond },
  targetChipText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  multiplierBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  multiplierBoxCrashed: { backgroundColor: "rgba(255,107,107,0.15)" },
  multiplierText: { color: colors.diamond, fontSize: 32, fontWeight: "900" },
  multiplierTextCrashed: { color: colors.danger },
  runningHint: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
  crashedHint: { color: colors.danger, fontSize: 12, marginTop: spacing.xs, fontWeight: "700" },
  button: { backgroundColor: colors.diamond, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#0a2a2e", fontWeight: "800" },
  error: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm },
  win: { color: colors.success, textAlign: "center", marginBottom: spacing.sm },
  lose: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm },
});
