import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";

type HighlightBulletRowProps = {
  text: string;
};

export function HighlightBulletRow({ text }: HighlightBulletRowProps) {
  return (
    <View style={styles.highlightRow}>
      <Text style={styles.recordType}>•</Text>
      <Text style={styles.evidence}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  highlightRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10
  },
  recordType: {
    color: palette.brand,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  evidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  }
});
