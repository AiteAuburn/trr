import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";

type HistoryNoRangeRecordsCardProps = {
  body: string;
  title: string;
};

export function HistoryNoRangeRecordsCard({ body, title }: HistoryNoRangeRecordsCardProps) {
  return (
    <View style={styles.emptyStateCard}>
      <View style={styles.iconCircle}>
        <Text>📅</Text>
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.recordContent}>{title}</Text>
        <Text style={styles.evidence}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyStateCard: {
    alignItems: "flex-start",
    backgroundColor: palette.subtle,
    borderColor: palette.accentBorder,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    padding: 16
  },
  evidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: palette.wash,
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  recordContent: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  timelineContent: {
    flex: 1,
    gap: 4
  }
});
