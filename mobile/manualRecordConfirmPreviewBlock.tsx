import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";

type ManualRecordConfirmPreviewBlockProps = {
  badgeLabel: string;
  icon: string;
  introText: string;
  payloadSummary: string;
  sourceLine: string;
  typeLabel: string;
};

type ManualRecordConfirmPreviewItem = {
  icon: string;
  payloadSummary: string;
  sourceLine: string;
  typeLabel: string;
};

export function manualConfirmPreviewIcon(item: ManualRecordConfirmPreviewItem) {
  return item.icon;
}

export function manualConfirmPreviewPayloadSummary(item: ManualRecordConfirmPreviewItem) {
  return item.payloadSummary;
}

export function manualConfirmPreviewSourceLine(item: ManualRecordConfirmPreviewItem) {
  return item.sourceLine;
}

export function manualConfirmPreviewTypeLabel(item: ManualRecordConfirmPreviewItem) {
  return item.typeLabel;
}

export function ManualRecordConfirmPreviewBlock({
  badgeLabel,
  icon,
  introText,
  payloadSummary,
  sourceLine,
  typeLabel
}: ManualRecordConfirmPreviewBlockProps) {
  return (
    <>
      <View style={styles.inlineInfoBlock}>
        <Text style={styles.previewModeBadge}>{badgeLabel}</Text>
        <Text style={styles.evidence}>{introText}</Text>
      </View>
      <View style={styles.emptyStateCard}>
        <View style={styles.iconCircleSmall}>
          <Text>{icon}</Text>
        </View>
        <View style={styles.timelineContent}>
          <Text style={styles.recordType}>{typeLabel}</Text>
          <Text style={styles.recordContent}>{payloadSummary}</Text>
          <Text style={styles.evidence}>{sourceLine}</Text>
        </View>
      </View>
    </>
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
  iconCircleSmall: {
    alignItems: "center",
    backgroundColor: palette.wash,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  inlineInfoBlock: {
    gap: 8,
    paddingVertical: 2
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
