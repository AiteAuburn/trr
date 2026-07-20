import { StyleSheet, Text, View } from "react-native";

export type DailyTranscriptDisplayItem = {
  key: string;
  sourceText: string;
  timeLabel: string;
};

type DailyTranscriptListProps = {
  items: readonly DailyTranscriptDisplayItem[];
};

function todayTranscriptItemKey(item: DailyTranscriptDisplayItem) {
  return item.key;
}

function todayTranscriptItemTimeLabel(item: DailyTranscriptDisplayItem) {
  return item.timeLabel;
}

function todayTranscriptItemSourceText(item: DailyTranscriptDisplayItem) {
  return item.sourceText;
}

export function DailyTranscriptList({ items }: DailyTranscriptListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.dailyTranscriptList}>
      {items.map((item) => (
        <View key={todayTranscriptItemKey(item)} style={styles.dailyTranscriptItem}>
          <Text style={styles.confidence}>{todayTranscriptItemTimeLabel(item)}</Text>
          <Text style={styles.evidence}>{todayTranscriptItemSourceText(item)}</Text>
        </View>
      ))}
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
  dailyTranscriptItem: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 12
  },
  dailyTranscriptList: {
    gap: 8
  },
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  }
});
