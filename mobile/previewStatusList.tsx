import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";

export type PreviewStatusRow = {
  accessibilityLabel?: string;
  copy: string;
  icon?: string;
  statusLabel: string;
  time?: string;
  title: string;
};

type PreviewStatusListProps = {
  iconFallback?: string;
  rows: PreviewStatusRow[];
};

function previewStatusRowKey(row: PreviewStatusRow) {
  return row.title;
}

function previewStatusRowAccessibilityLabel(row: PreviewStatusRow) {
  return row.accessibilityLabel;
}

function previewStatusRowIcon(row: PreviewStatusRow, iconFallback: string) {
  return row.icon ?? iconFallback;
}

function previewStatusRowTitle(row: PreviewStatusRow) {
  return row.title;
}

function previewStatusRowCopy(row: PreviewStatusRow) {
  return row.copy;
}

function previewStatusRowStatusLabel(row: PreviewStatusRow) {
  return row.statusLabel;
}

function previewTimedRowTime(row: PreviewStatusRow) {
  return row.time;
}

export function PreviewStatusList({ iconFallback = "•", rows }: PreviewStatusListProps) {
  return (
    <>
      {rows.map((row) => (
        <View
          key={previewStatusRowKey(row)}
          accessibilityLabel={previewStatusRowAccessibilityLabel(row)}
          style={styles.aiReviewCard}
        >
          <View style={styles.iconCircleSmall}>
            <Text>{previewStatusRowIcon(row, iconFallback)}</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.recordContent}>{previewStatusRowTitle(row)}</Text>
            {previewTimedRowTime(row) ? (
              <Text style={styles.confidence}>{previewTimedRowTime(row)}</Text>
            ) : null}
            <Text style={styles.evidence}>{previewStatusRowCopy(row)}</Text>
          </View>
          <Text style={styles.previewModeBadge}>{previewStatusRowStatusLabel(row)}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  aiReviewCard: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.accentBorder,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    padding: 14
  },
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
  iconCircleSmall: {
    alignItems: "center",
    backgroundColor: palette.wash,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
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
  recordContent: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
