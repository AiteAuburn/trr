import { StyleSheet, Text, View } from "react-native";

type DailyRecordDetailRowProps = {
  label: string;
  value: string;
};

export function DailyRecordDetailRow({ label, value }: DailyRecordDetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.confidence}>{label}</Text>
      <Text style={styles.evidence}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  confidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  detailRow: {
    alignItems: "flex-start",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    padding: 14
  },
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  }
});
