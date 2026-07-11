import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii } from "@/theme";
import { findSeatReaction } from "@/constants/seatReactions";

interface Props {
  reactionId: string;
  onDone: () => void;
}

export function SeatReactionBubble({ reactionId, onDone }: Props) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const reaction = findSeatReaction(reactionId);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.1, friction: 4, tension: 90, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 400, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -30, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactionId]);

  if (!reaction) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrapper, { opacity, transform: [{ scale }, { translateY }] }]}
    >
      {reaction.emoji ? (
        <Text style={styles.emoji}>{reaction.emoji}</Text>
      ) : (
        <LinearGradient colors={[colors.primary, "#8a3ffb"]} style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>🚀 CODE</Text>
        </LinearGradient>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: -34,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  emoji: { fontSize: 40 },
  codeBadge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  codeBadgeText: { color: "#fff", fontSize: 12, fontWeight: "900" },
});
