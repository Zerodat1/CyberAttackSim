import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { apiClient } from "@/api/client";
import { colors, radii, spacing } from "@/theme";
import type { RoomDetail } from "@/api/types";
import type { AppStackParamList } from "@/navigation/RootNavigator";

interface Props {
  visible: boolean;
  room: RoomDetail;
  isOwner: boolean;
  onClose: () => void;
  navigation: NativeStackNavigationProp<AppStackParamList, "Room">;
}

export function RoomSettingsModal({ visible, room, isOwner, onClose, navigation }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(room.name);
  const [passwordProtected, setPasswordProtected] = useState(room.isPasswordProtected);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(room.name);
      setPasswordProtected(room.isPasswordProtected);
      setPassword("");
      setError(null);
      setSuccess(null);
      setConfirmingDelete(false);
    }
  }, [visible, room]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiClient.patch(`/rooms/${room.id}`, {
        name,
        isPasswordProtected: passwordProtected,
        ...(passwordProtected && password ? { password } : {}),
      }),
    onSuccess: () => {
      setSuccess("تم حفظ إعدادات الغرفة");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["room", room.id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? "تعذر حفظ الإعدادات");
      setSuccess(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => apiClient.delete(`/rooms/${room.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onClose();
      navigation.navigate("RoomsList");
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "تعذر حذف الغرفة"),
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>إعدادات الغرفة</Text>
            <View style={{ width: 20 }} />
          </View>

          <Text style={styles.label}>اسم الغرفة</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <View style={styles.switchRow}>
            <Switch
              value={passwordProtected}
              onValueChange={setPasswordProtected}
              trackColor={{ true: colors.primary, false: colors.surfaceMuted }}
            />
            <Text style={styles.label}>حماية الغرفة بكلمة مرور</Text>
          </View>

          {passwordProtected && (
            <>
              <Text style={styles.label}>كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••"
                placeholderTextColor={colors.textMuted}
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
          {success && <Text style={styles.success}>{success}</Text>}

          <TouchableOpacity
            style={styles.saveButton}
            disabled={!name || saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>حفظ التغييرات</Text>}
          </TouchableOpacity>

          {isOwner && (
            <>
              <View style={styles.divider} />
              {!confirmingDelete ? (
                <TouchableOpacity style={styles.deleteButton} onPress={() => setConfirmingDelete(true)}>
                  <Text style={styles.deleteButtonText}>حذف الغرفة نهائيًا</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>هل أنت متأكد؟ لا يمكن التراجع عن حذف الغرفة</Text>
                  <View style={styles.confirmRow}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      disabled={deleteMutation.isPending}
                      onPress={() => deleteMutation.mutate()}
                    >
                      {deleteMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.deleteButtonText}>نعم، احذف الغرفة</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmingDelete(false)}>
                      <Text style={styles.saveButtonText}>تراجع</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
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
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  closeIcon: { color: colors.textMuted, fontSize: 16 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  label: { color: colors.textSecondary, textAlign: "right", marginBottom: spacing.xs, flex: 1 },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    textAlign: "right",
  },
  switchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: spacing.lg },
  deleteButton: {
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    flex: 1,
  },
  deleteButtonText: { color: "#fff", fontWeight: "700" },
  confirmBox: { alignItems: "center" },
  confirmText: { color: colors.textSecondary, textAlign: "center", marginBottom: spacing.md, fontSize: 12 },
  confirmRow: { flexDirection: "row", gap: spacing.md, width: "100%" },
  cancelButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    flex: 1,
  },
  error: { color: colors.danger, textAlign: "center", marginBottom: spacing.sm },
  success: { color: colors.success, textAlign: "center", marginBottom: spacing.sm },
});
