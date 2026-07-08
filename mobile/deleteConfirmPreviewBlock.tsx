import { StyleSheet, Text, View } from "react-native";

type DeleteConfirmPreviewBlockProps = {
  dangerLabel: string;
  introText: string;
  recordMetaText: string;
  recordSummary: string;
  recordTypeLabel: string;
};

export function DeleteConfirmPreviewBlock({
  dangerLabel,
  introText,
  recordMetaText,
  recordSummary,
  recordTypeLabel
}: DeleteConfirmPreviewBlockProps) {
  return (
    <>
      <View style={styles.inlineInfoBlock}>
        <Text style={styles.previewModeBadge}>{dangerLabel}</Text>
        <Text style={styles.evidence}>{introText}</Text>
      </View>
      <View style={styles.emptyStateCard}>
        <View style={styles.dangerIconCircle}>
          <Text style={styles.successIconText}>!</Text>
        </View>
        <View style={styles.timelineContent}>
          <Text style={styles.recordType}>{recordTypeLabel}</Text>
          <Text style={styles.recordContent}>{recordSummary}</Text>
          <Text style={styles.evidence}>{recordMetaText}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dangerIconCircle: {
    alignItems: "center",
    backgroundColor: "#C85D5D",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  emptyStateCard: {
    alignItems: "flex-start",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    padding: 16
  },
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  inlineInfoBlock: {
    gap: 8,
    paddingVertical: 2
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
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  recordType: {
    color: "#3FA67F",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  successIconText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900"
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
