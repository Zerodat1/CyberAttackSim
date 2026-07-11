import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "@/theme";
import { SEAT_REACTIONS } from "@/constants/seatReactions";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (reactionId: string) => void;
}

export function SeatReactionModal({ visible, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>تفاعلات المايك</Text>
          <View style={styles.grid}>
            {SEAT_REACTIONS.map((reaction) => (
              <TouchableOpacity
                key={reaction.id}
                style={styles.tile}
                onPress={() => {
                  onSelect(reaction.id);
                  onClose();
                }}
              >
                {reaction.emoji ? (
                  <Text style={styles.emoji}>{reaction.emoji}</Text>
                ) : (
                  <LinearGradient colors={[colors.primary, "#8a3ffb"]} style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>🚀 CODE</Text>
                  </LinearGradient>
                )}
                <Text style={styles.label} numberOfLines={1}>
                  {reaction.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
  },
  title: { color: colors.textPrimary, fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "center" },
  tile: {
    width: 72,
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  emoji: { fontSize: 32, marginBottom: spacing.xs },
  codeBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  codeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
  cancelButton: { alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.md },
  cancelButtonText: { color: colors.textSecondary, fontWeight: "600" },
});
