import type { ReactNode } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "@/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  icon: string;
  title: string;
  subtitle?: string;
  gradientColors: [string, string];
  children: ReactNode;
}

export function GameModalFrame({ visible, onClose, icon, title, subtitle, gradientColors, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient colors={gradientColors} style={styles.header}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </LinearGradient>
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: spacing.lg }}>
            {children}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: "88%",
    overflow: "hidden",
  },
  header: { alignItems: "center", paddingVertical: spacing.xl, paddingHorizontal: spacing.xl },
  icon: { fontSize: 34, marginBottom: spacing.xs },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4, textAlign: "center" },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  closeButton: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "700" },
});
