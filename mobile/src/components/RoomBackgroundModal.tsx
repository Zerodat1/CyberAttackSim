import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import { uploadImageDataUri } from "@/utils/uploadImage";
import { gradientBackgroundKey, ROOM_BACKGROUND_PRESETS } from "@/constants/roomBackgrounds";

interface Props {
  visible: boolean;
  roomId: string;
  currentBackgroundUrl: string | null;
  onClose: () => void;
}

export function RoomBackgroundModal({ visible, roomId, currentBackgroundUrl, onClose }: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(currentBackgroundUrl);
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelected(currentBackgroundUrl);
      setCustomUrl(
        currentBackgroundUrl && !currentBackgroundUrl.startsWith("gradient:") ? currentBackgroundUrl : null,
      );
      setError(null);
    }
  }, [visible, currentBackgroundUrl]);

  const saveMutation = useMutation({
    mutationFn: async () => apiClient.patch(`/rooms/${roomId}`, { backgroundUrl: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر تغيير خلفية الغرفة"),
  });

  async function pickCustomImage() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("يجب السماح بالوصول إلى الصور لاختيار خلفية");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.6,
      base64: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;

    setUploading(true);
    try {
      const mime = asset.mimeType ?? "image/jpeg";
      const url = await uploadImageDataUri(`data:${mime};base64,${asset.base64}`, "room-covers");
      setCustomUrl(url);
      setSelected(url);
    } catch {
      setError("تعذر رفع الصورة، حاول مجددًا");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>اختر صورة الخلفية</Text>

          <ScrollView contentContainerStyle={styles.grid}>
            <TouchableOpacity
              style={[styles.tile, selected === null && styles.tileActive]}
              onPress={() => setSelected(null)}
            >
              <LinearGradient colors={ROOM_BACKGROUND_PRESETS[0].colors} style={styles.tileFill}>
                <Text style={styles.defaultLabel}>افتراضي</Text>
              </LinearGradient>
              {selected === null && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tile, styles.addTile]} onPress={pickCustomImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : customUrl ? (
                <Image source={{ uri: customUrl }} style={styles.tileFill} />
              ) : (
                <Text style={styles.addTileIcon}>+</Text>
              )}
              {customUrl && selected === customUrl && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {ROOM_BACKGROUND_PRESETS.map((preset) => {
              const key = gradientBackgroundKey(preset.id);
              const active = selected === key;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.tile, active && styles.tileActive]}
                  onPress={() => setSelected(key)}
                >
                  <LinearGradient colors={preset.colors} style={styles.tileFill}>
                    <Text style={styles.presetLabel}>{preset.label}</Text>
                  </LinearGradient>
                  {active && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
    maxHeight: "85%",
  },
  title: { color: colors.textPrimary, fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "center", paddingBottom: spacing.md },
  tile: {
    width: "29%",
    aspectRatio: 0.85,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.surfaceMuted,
  },
  tileActive: { borderColor: colors.primary },
  tileFill: { flex: 1, alignItems: "center", justifyContent: "flex-end", padding: spacing.xs },
  addTile: { alignItems: "center", justifyContent: "center" },
  addTileIcon: { color: colors.textMuted, fontSize: 32, fontWeight: "300" },
  defaultLabel: { color: "#fff", fontSize: 11, fontWeight: "700" },
  presetLabel: { color: "#fff", fontSize: 11, fontWeight: "700" },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.giftPink,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
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
