import { StyleSheet, View } from "react-native";
import { palette } from "./designTokens";

/** Small, platform-independent line icons; no font download is needed. */
export function NavigationGlyph({ children }: { children: string }) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.frame}>
      {children === "🎙" ? <>
        <View style={styles.capsule} /><View style={styles.cradle} /><View style={styles.stem} />
      </> : children === "🗂" ? <>
        <View style={styles.calendar}><View style={styles.rule} /><View style={styles.date} /></View>
        <View style={[styles.binding, { left: 9 }]} /><View style={[styles.binding, { right: 9 }]} />
      </> : children === "📊" ? <View style={styles.chart}>
        <View style={[styles.bar, { height: 10 }]} /><View style={[styles.bar, { height: 21 }]} /><View style={[styles.bar, { height: 15 }]} />
      </View> : <View style={styles.sliders}>
        <View style={styles.slider}><View style={[styles.knob, { left: 5 }]} /></View>
        <View style={styles.slider}><View style={[styles.knob, { right: 4 }]} /></View>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  capsule: { position: "absolute", top: 2, width: 11, height: 18, borderRadius: 6, borderWidth: 2, borderColor: palette.brand },
  cradle: { position: "absolute", top: 12, width: 21, height: 14, borderWidth: 2, borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderColor: palette.brand },
  stem: { position: "absolute", top: 25, height: 6, width: 2, backgroundColor: palette.brand },
  calendar: { width: 25, height: 25, borderWidth: 2, borderRadius: 6, borderColor: palette.brand, paddingTop: 7, marginTop: 3 },
  rule: { height: 2, backgroundColor: palette.brand },
  date: { width: 5, height: 5, borderRadius: 2, backgroundColor: palette.brand, marginTop: 4, marginLeft: 5 },
  binding: { position: "absolute", width: 2, height: 7, top: 1, borderRadius: 1, backgroundColor: palette.brand },
  chart: { width: 25, height: 25, flexDirection: "row", alignItems: "flex-end", gap: 4 },
  bar: { width: 5, borderRadius: 3, backgroundColor: palette.brand },
  sliders: { width: 26, gap: 12 },
  slider: { height: 2, backgroundColor: palette.brand },
  knob: { position: "absolute", top: -3, width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: palette.brand, backgroundColor: palette.wash }
});
