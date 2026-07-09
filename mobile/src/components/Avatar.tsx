import { Image, StyleSheet, Text, View } from "react-native";
import { colorForName, initialsOf } from "@/theme";

interface Props {
  name: string;
  size?: number;
  imageUrl?: string | null;
}

export function Avatar({ name, size = 40, imageUrl }: Props) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorForName(name) },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontWeight: "700" },
});
