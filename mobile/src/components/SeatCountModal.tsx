import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";

interface Props {
  visible: boolean;
  roomId: string;
  currentSeatCount: number;
  onClose: () => void;
}

const SEAT_OPTIONS = [4, 8, 10, 15, 20];

function SeatPreviewGrid({ count, active }: { count: number; active: boolean }) {
  return (
    <View style={styles.previewGrid}>
      {Array.from({ length: count }, (_, index) => (
        <Text key={index} style={[styles.previewSeat, active && styles.previewSeatActive]}>
          🛋️
        </Text>
      ))}
    </View>
  );
}

export function SeatCountModal({ visible, roomId, currentSeatCount, onClose }: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(currentSeatCount);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelected(currentSeatCount);
      setError(null);
    }
  }, [visible, currentSeatCount]);

  const saveMutation = useMutation({
    mutationFn: async () => apiClient.patch(`/rooms/${roomId}`, { seatCount: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر تغيير عدد المقاعد"),
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>مقعد المايك</Text>

          <View style={styles.optionsGrid}>
            {SEAT_OPTIONS.map((count) => {
              const active = selected === count;
              return (
                <TouchableOpacity
                  key={count}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => setSelected(count)}
                >
                  <SeatPreviewGrid count={count} active={active} />
                  <View style={[styles.optionLabelBar, active && styles.optionLabelBarActive]}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{count} مقعد المايك</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.confirmButton, saveMutation.isPending && styles.confirmButtonDisabled]}
            disabled={saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>تأكيد</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>إلغاء</Text>
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
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "center" },
  optionCard: {
    width: "30%",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: spacing.md,
  },
  optionCardActive: { borderColor: colors.primary },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  previewSeat: { fontSize: 14, opacity: 0.5 },
  previewSeatActive: { opacity: 1 },
  optionLabelBar: { backgroundColor: colors.background, paddingVertical: spacing.xs, alignItems: "center" },
  optionLabelBarActive: { backgroundColor: colors.primary },
  optionLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
  optionLabelActive: { color: "#fff" },
  error: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: "#fff", fontWeight: "700" },
  cancelButton: { alignItems: "center", paddingVertical: spacing.md },
  cancelButtonText: { color: colors.textSecondary, fontWeight: "600" },
});
