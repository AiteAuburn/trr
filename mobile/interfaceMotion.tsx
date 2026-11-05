import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, AppState, Easing, StyleSheet, View } from "react-native";
import { motion, palette } from "./designTokens";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return reduced;
}

/** Animate only while visible; respect the device's reduce-motion preference. */
export function useBreathingMotion(active: boolean) {
  const reduced = useReducedMotion();
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setForeground(state === "active"));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    value.setValue(0);
    if (!active || reduced || !foreground) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration: motion.breathe, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(value, { toValue: 0, duration: motion.breathe, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false })
    ]));
    animation.start();
    return () => animation.stop();
  }, [active, foreground, reduced, value]);
  return value;
}

export function ScreenTransition({ screen, children }: { screen: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1, duration: motion.enter, easing: Easing.out(Easing.cubic), useNativeDriver: true
    });
    animation.start();
    return () => animation.stop();
  }, [screen, reduced, progress]);
  return <Animated.View style={{ gap: 16, opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }}>{children}</Animated.View>;
}

export function RecordingGlyph({ active }: { active: boolean }) {
  const progress = useBreathingMotion(active);
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.recordingGlyph}>
      <Animated.View style={[styles.recordingHalo, { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.2] }), transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.12] }) }] }]} />
      <View style={styles.micCapsule} />
      <View style={styles.micCradle} />
      <View style={styles.micStem} />
      <View style={styles.micBase} />
    </View>
  );
}

export function SuccessMark() {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.spring(progress, { toValue: 1, damping: 16, stiffness: 150, mass: 0.8, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [reduced, progress]);
  return (
    <Animated.View accessible={false} importantForAccessibility="no-hide-descendants" style={[styles.successHalo, { opacity: progress, transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
      <View style={styles.successDisc}><View style={styles.check} /></View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  recordingGlyph: { width: 100, height: 100, alignItems: "center", justifyContent: "center" },
  recordingHalo: { position: "absolute", width: 146, height: 146, borderRadius: 73, backgroundColor: palette.onBrand },
  micCapsule: { position: "absolute", top: 18, width: 25, height: 43, borderRadius: 14, borderWidth: 3, borderColor: palette.onBrand },
  micCradle: { position: "absolute", top: 39, width: 43, height: 34, borderWidth: 3, borderTopWidth: 0, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, borderColor: palette.onBrand },
  micStem: { position: "absolute", top: 73, width: 3, height: 12, backgroundColor: palette.onBrand },
  micBase: { position: "absolute", top: 84, width: 26, height: 3, borderRadius: 2, backgroundColor: palette.onBrand },
  successHalo: { width: 100, height: 100, borderRadius: 50, backgroundColor: palette.wash, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  successDisc: { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.brand, alignItems: "center", justifyContent: "center" },
  check: { width: 25, height: 14, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: palette.onBrand, transform: [{ rotate: "-45deg" }], marginTop: -5 }
});
