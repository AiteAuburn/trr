import { StyleSheet, Text, View } from "react-native";

type HistoryRawTranscriptCardProps = {
  rawText: string;
  sourceStatusLabel: string;
  timeLabel: string;
  typeLabel: string;
};

export function HistoryRawTranscriptCard({
  rawText,
  sourceStatusLabel,
  timeLabel,
  typeLabel
}: HistoryRawTranscriptCardProps) {
  return (
    <View style={styles.historyRawCard}>
      <View style={styles.historyItemHeader}>
        <Text style={styles.recordType}>{typeLabel}</Text>
        <View style={styles.timelineContent}>
          <Text style={styles.confidence}>{timeLabel}</Text>
          <Text style={styles.previewModeBadge}>{sourceStatusLabel}</Text>
        </View>
      </View>
      <Text style={styles.evidence}>{rawText}</Text>
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
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  historyItemHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  historyRawCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  previewModeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF6F1",
    borderColor: "#D6EEE4",
    borderRadius: 999,
    borderWidth: 1,
    color: "#0F3F37",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  recordType: {
    color: "#3FA67F",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
