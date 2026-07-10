import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, radii, spacing } from "@/theme";

interface Props {
  value: string;
  onChange: (value: string) => void;
  quickAmounts?: number[];
}

const DEFAULT_QUICK_AMOUNTS = [1000, 10000, 100000, 1000000];

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `${amount / 1_000_000}M`;
  if (amount >= 1_000) return `${amount / 1_000}K`;
  return String(amount);
}

export function BetAmountInput({ value, onChange, quickAmounts = DEFAULT_QUICK_AMOUNTS }: Props) {
  return (
    <View>
      <Text style={styles.label}>مبلغ الرهان</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={onChange} />
      <View style={styles.quickRow}>
        {quickAmounts.map((amount) => (
          <TouchableOpacity key={amount} style={styles.quickChip} onPress={() => onChange(String(amount))}>
            <Text style={styles.quickChipText}>{formatAmount(amount)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, textAlign: "right", marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  quickRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  quickChip: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  quickChipText: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
});
