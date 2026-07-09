import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { apiClient } from "@/api/client";
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
      (await apiClient.post<PlayDiceResult>("/games/dice/play", {
        betAmount: Number(betAmount),
        choice,
        roomId,
      })).data,
    onSuccess: (data) => {
      setLastResult(data);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر تنفيذ الرهان"),
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>لعبة تخمين الرقم 🎲</Text>
          {settings && (
            <Text style={styles.hint}>
              الرهان بين {settings.minBet} و {settings.maxBet} ذهب — الفوز يضاعف رهانك x{settings.winMultiplier}
            </Text>
          )}

          <Text style={styles.label}>مبلغ الرهان</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={betAmount}
            onChangeText={setBetAmount}
          />

          <Text style={styles.label}>اختر رقمًا من 0 إلى 9</Text>
          <View style={styles.numbersRow}>
            {NUMBERS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.numberChip, choice === n && styles.numberChipActive]}
                onPress={() => setChoice(n)}
              >
                <Text style={styles.numberText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {playMutation.isPending && <ActivityIndicator color="#5b4cf5" style={{ marginBottom: 10 }} />}
          {error && <Text style={styles.error}>{error}</Text>}
          {lastResult && (
            <Text style={lastResult.round.isWin ? styles.win : styles.lose}>
              {lastResult.round.isWin
                ? `فزت! الرقم كان ${lastResult.round.rolledNumber} — ربحت ${lastResult.round.payout} ذهب`
                : `خسرت، الرقم كان ${lastResult.round.rolledNumber}`}
              {" — رصيدك الآن: "}
              {lastResult.goldBalance}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, choice === null && styles.buttonDisabled]}
            disabled={choice === null || playMutation.isPending}
            onPress={() => playMutation.mutate()}
          >
            <Text style={styles.buttonText}>راهن الآن</Text>
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
  title: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "right", marginBottom: 8 },
  hint: { color: "#aab0d8", fontSize: 12, textAlign: "right", marginBottom: 16 },
  label: { color: "#aab0d8", textAlign: "right", marginBottom: 6 },
  input: {
    backgroundColor: "#0f1020",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    textAlign: "right",
  },
  numbersRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  numberChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2c50",
    alignItems: "center",
    justifyContent: "center",
  },
  numberChipActive: { backgroundColor: "#5b4cf5" },
  numberText: { color: "#fff", fontWeight: "700" },
  button: { backgroundColor: "#5b4cf5", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  buttonSecondary: { backgroundColor: "#2a2c50", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#ff6b6b", textAlign: "center", marginBottom: 8 },
  win: { color: "#4cd964", textAlign: "center", marginBottom: 8 },
  lose: { color: "#ff6b6b", textAlign: "center", marginBottom: 8 },
});
