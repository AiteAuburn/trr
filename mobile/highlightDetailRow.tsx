import { StyleSheet, Text, View } from "react-native";

type HighlightDetailRowProps = {
  label: string;
  value: string;
};

export function HighlightDetailRow({ label, value }: HighlightDetailRowProps) {
  return (
    <View style={styles.highlightRow}>
      <Text style={styles.recordType}>{label}</Text>
      <Text style={styles.evidence}>{value}</Text>
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
    color: "#3FA67F",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  }
});
