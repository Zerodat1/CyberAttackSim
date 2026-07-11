import { Image, StyleSheet, Text, View } from "react-native";
import { colorForName, initialsOf } from "@/theme";

interface Props {
  name: string;
  size?: number;
  imageUrl?: string | null;
  frameColor?: string | null;
  frameEmoji?: string | null;
}

export function Avatar({ name, size = 40, imageUrl, frameColor, frameEmoji }: Props) {
  const inner = imageUrl ? (
    <Image source={{ uri: imageUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorForName(name) },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initialsOf(name)}</Text>
    </View>
  );

  if (!frameColor) {
    return inner;
  }

  const ringSize = size + 8;
  const badgeSize = Math.max(14, size * 0.32);

  return (
    <View
      style={[
        styles.ring,
        { width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderColor: frameColor },
      ]}
    >
      {inner}
      {frameEmoji && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: frameColor,
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        >
          <Text style={{ fontSize: badgeSize * 0.6 }}>{frameEmoji}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontWeight: "700" },
  ring: { alignItems: "center", justifyContent: "center", borderWidth: 2 },
  badge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0f1020",
  },
});
