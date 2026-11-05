import { palette } from "./designTokens";
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
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  evidence: {
    color: palette.secondary,
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
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  previewModeBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.wash,
    borderColor: palette.accentBorder,
    borderRadius: 999,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  recordType: {
    color: palette.brand,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
