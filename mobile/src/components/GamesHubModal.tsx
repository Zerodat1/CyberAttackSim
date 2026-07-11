import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "@/theme";
import { DiceGameModal } from "@/components/DiceGameModal";
import { WheelGameModal } from "@/components/WheelGameModal";
import { SlotsGameModal } from "@/components/SlotsGameModal";
import { CrashGameModal } from "@/components/CrashGameModal";

interface Props {
  visible: boolean;
  roomId: string;
  onClose: () => void;
}

type GameKey = "dice" | "wheel" | "slots" | "crash";

const GAMES: { key: GameKey; icon: string; name: string; description: string; gradient: [string, string] }[] = [
  { key: "dice", icon: "🎲", name: "تخمين الرقم", description: "خمّن الرقم واربح x9", gradient: [colors.primary, "#8a3ffb"] },
  { key: "wheel", icon: "🎡", name: "عجلة الحظ", description: "أدر العجلة واربح حتى x20", gradient: ["#f5c451", "#e08a1f"] },
  { key: "slots", icon: "🎰", name: "ماكينة الحظ", description: "3 رموز متطابقة تربحك الجائزة", gradient: ["#e0507a", "#8a3ffb"] },
  { key: "crash", icon: "🚀", name: "الصاروخ", description: "اسحب قبل أن ينفجر", gradient: ["#0984e3", "#00cec9"] },
];

export function GamesHubModal({ visible, roomId, onClose }: Props) {
  const [activeGame, setActiveGame] = useState<GameKey | null>(null);

  return (
    <>
      <Modal visible={visible && !activeGame} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>ألعاب الرهان</Text>
            <View style={styles.grid}>
              {GAMES.map((game) => (
                <TouchableOpacity key={game.key} style={styles.gameCard} onPress={() => setActiveGame(game.key)}>
                  <LinearGradient colors={game.gradient} style={styles.gameIconWrap}>
                    <Text style={styles.gameIcon}>{game.icon}</Text>
                  </LinearGradient>
                  <Text style={styles.gameName}>{game.name}</Text>
                  <Text style={styles.gameDescription}>{game.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DiceGameModal visible={activeGame === "dice"} roomId={roomId} onClose={() => setActiveGame(null)} />
      <WheelGameModal visible={activeGame === "wheel"} roomId={roomId} onClose={() => setActiveGame(null)} />
      <SlotsGameModal visible={activeGame === "slots"} roomId={roomId} onClose={() => setActiveGame(null)} />
      <CrashGameModal visible={activeGame === "crash"} roomId={roomId} onClose={() => setActiveGame(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", textAlign: "right", marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.lg },
  gameCard: {
    width: "47%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
  gameIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  gameIcon: { fontSize: 26 },
  gameName: { color: colors.textPrimary, fontWeight: "700", fontSize: 14, marginBottom: 2 },
  gameDescription: { color: colors.textMuted, fontSize: 11, textAlign: "center" },
  closeButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "700" },
});
