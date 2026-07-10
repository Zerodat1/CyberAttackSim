import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "@/theme";

interface Props {
  isWin: boolean;
  title: string;
  subtitle: string;
}

const PARTICLE_EMOJIS = ["✨", "🎉", "💰", "⭐"];
const PARTICLE_COUNT = 10;

function buildParticles() {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    progress: new Animated.Value(0),
    angle: Math.random() * Math.PI * 2,
    distance: 55 + Math.random() * 45,
    emoji: PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)],
  }));
}

export function GameResultBanner({ isWin, title, subtitle }: Props) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const particles = useRef(buildParticles()).current;

  useEffect(() => {
    scale.setValue(0.6);
    opacity.setValue(0);
    glow.setValue(0);
    particles.forEach((p) => p.progress.setValue(0));

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();

    if (isWin) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.35, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();

      particles.forEach((p, i) => {
        Animated.timing(p.progress, {
          toValue: 1,
          duration: 900 + i * 30,
          delay: i * 25,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWin, title, subtitle]);

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ scale }] }]}>
      {isWin && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
            },
          ]}
        />
      )}
      {isWin &&
        particles.map((p, i) => {
          const tx = Animated.multiply(p.progress, Math.cos(p.angle) * p.distance);
          const ty = Animated.multiply(p.progress, Math.sin(p.angle) * p.distance);
          const particleOpacity = p.progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
          const particleScale = p.progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.1] });
          return (
            <Animated.Text
              key={i}
              style={[
                styles.particle,
                { opacity: particleOpacity, transform: [{ translateX: tx }, { translateY: ty }, { scale: particleScale }] },
              ]}
            >
              {p.emoji}
            </Animated.Text>
          );
        })}

      <LinearGradient
        colors={isWin ? ["#ffd76b", "#f5a623"] : ["#2a2c50", "#1c1e3a"]}
        style={[styles.card, !isWin && styles.cardLose]}
      >
        <Text style={styles.icon}>{isWin ? "🎉" : "💔"}</Text>
        <Text style={[styles.title, !isWin && styles.titleLose]}>{title}</Text>
        <Text style={[styles.subtitle, !isWin && styles.subtitleLose]}>{subtitle}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  glow: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.gold,
  },
  particle: { position: "absolute", fontSize: 20 },
  card: {
    width: "100%",
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardLose: { shadowOpacity: 0, elevation: 0 },
  icon: { fontSize: 34, marginBottom: spacing.xs },
  title: { color: "#3a2200", fontWeight: "900", fontSize: 16, textAlign: "center" },
  titleLose: { color: colors.textPrimary },
  subtitle: { color: "#3a2200", fontSize: 13, marginTop: 4, textAlign: "center", opacity: 0.85 },
  subtitleLose: { color: colors.textSecondary },
});
