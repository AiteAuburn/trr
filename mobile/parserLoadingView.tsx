import { palette } from "./designTokens";
import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, View } from "react-native";
import { useBreathingMotion } from "./interfaceMotion";

export function ParserLoadingView() {
  const progress = useBreathingMotion(true);
  const [takingLonger, setTakingLonger] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTakingLonger(true), 15000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityLabel="AI 正在整理紀錄，文字已暫時鎖定"
      accessibilityValue={{ text: "處理中" }}
      style={styles.shell}
    >
      <Animated.View style={[styles.glow, { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.85] }), transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.05] }) }] }]} />
      <View style={styles.card}>
        <View style={styles.orb}>
          <ActivityIndicator color={palette.surface} size="large" />
        </View>
        <Text style={styles.eyebrow}>把日常，整理成紀錄</Text>
        <Text style={styles.title}>正在讀懂這段紀錄</Text>
        <Text style={styles.body}>
          血糖、餐點、運動與用藥，會各自找到位置。整理好後，再由你確認。
        </Text>

        <View style={styles.lockPill}>
          <Text style={styles.lockIcon}>✓</Text>
          <Text style={styles.lockText}>確認之前，不會儲存</Text>
        </View>
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.footnote}>
        {takingLonger ? "這次整理需要多一點時間，請稍候" : "稍等一下，正在為你整理"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 440,
    overflow: "hidden",
    paddingHorizontal: 8,
    position: "relative"
  },
  glow: {
    backgroundColor: palette.wash,
    borderRadius: 999,
    height: 280,
    opacity: 0.72,
    position: "absolute",
    top: 32,
    width: 280
  },
  card: {
    alignItems: "center",
    gap: 12,
    maxWidth: 420,
    paddingHorizontal: 26,
    paddingVertical: 34,
    width: "100%"
  },
  orb: {
    alignItems: "center",
    backgroundColor: palette.brand,
    borderColor: "#CDEBDD",
    borderRadius: 999,
    borderWidth: 8,
    height: 92,
    justifyContent: "center",
    marginBottom: 4,
    width: 92
  },
  eyebrow: {
    color: palette.brand,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.1
  },
  title: {
    color: palette.ink,
    fontSize: 25,
    fontWeight: "700",
    lineHeight: 33,
    textAlign: "center"
  },
  body: {
    color: palette.secondary,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 23,
    maxWidth: 330,
    textAlign: "center"
  },
  lockPill: {
    alignItems: "center",
    backgroundColor: "#F1F8F5",
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  lockIcon: {
    color: palette.brand,
    fontSize: 13,
    fontWeight: "700"
  },
  lockText: {
    color: "#315C50",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  },
  footnote: {
    color: "#7E8E88",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 22,
    textAlign: "center"
  }
});
