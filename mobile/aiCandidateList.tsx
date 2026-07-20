import { StyleSheet, Text, View } from "react-native";
import { AiCandidateActionRow } from "./aiCandidateActionRow";

export type AiCandidateDisplayItem = {
  confidencePercent: number;
  decisionTraceDisplayText: string;
  editAccessibilityLabel: string;
  icon: string;
  index: number;
  key: string;
  lowConfidence: boolean;
  payloadSummary: string;
  removeAccessibilityLabel: string;
  sourceText: string;
  typeLabel: string;
};

type AiCandidateListProps = {
  editLabel: string;
  items: readonly AiCandidateDisplayItem[];
  lowConfidenceText: string;
  onEditCandidate: (index: number) => void;
  onRemoveCandidate: (index: number) => void;
  removeLabel: string;
};

function aiCandidateActionTarget(item: AiCandidateDisplayItem) {
  return item.index;
}

function aiCandidateDisplayKey(item: AiCandidateDisplayItem) {
  return item.key;
}

function aiCandidateDisplayIcon(item: AiCandidateDisplayItem) {
  return item.icon;
}

function aiCandidateDisplayTypeLabel(item: AiCandidateDisplayItem) {
  return item.typeLabel;
}

function aiCandidateDisplayPayloadSummary(item: AiCandidateDisplayItem) {
  return item.payloadSummary;
}

function aiCandidateDisplayConfidencePercent(item: AiCandidateDisplayItem) {
  return item.confidencePercent;
}

function aiCandidateDisplaySourceText(item: AiCandidateDisplayItem) {
  return item.sourceText;
}

function aiCandidateDisplayIsLowConfidence(item: AiCandidateDisplayItem) {
  return item.lowConfidence;
}

function aiCandidateDisplayDecisionTrace(item: AiCandidateDisplayItem) {
  return item.decisionTraceDisplayText;
}

function aiCandidateEditAccessibilityLabel(item: AiCandidateDisplayItem) {
  return item.editAccessibilityLabel;
}

function aiCandidateRemoveAccessibilityLabel(item: AiCandidateDisplayItem) {
  return item.removeAccessibilityLabel;
}

function pressAiCandidateEditAction(item: AiCandidateDisplayItem, onEditCandidate: (index: number) => void) {
  onEditCandidate(aiCandidateActionTarget(item));
}

function pressAiCandidateRemoveAction(item: AiCandidateDisplayItem, onRemoveCandidate: (index: number) => void) {
  onRemoveCandidate(aiCandidateActionTarget(item));
}

export function AiCandidateList({
  editLabel,
  items,
  lowConfidenceText,
  onEditCandidate,
  onRemoveCandidate,
  removeLabel
}: AiCandidateListProps) {
  return (
    <>
      {items.map((item) => (
        <View key={aiCandidateDisplayKey(item)} style={styles.aiReviewCardStack}>
          <View style={styles.recordHeader}>
            <View style={styles.historyItemTitle}>
              <View style={styles.iconCircleSmall}>
                <Text>{aiCandidateDisplayIcon(item)}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.confidence}>{aiCandidateDisplayTypeLabel(item)}</Text>
                <Text style={styles.recordContent}>{aiCandidateDisplayPayloadSummary(item)}</Text>
              </View>
            </View>
            <View style={styles.confidencePill}>
              <Text style={styles.confidence}>{aiCandidateDisplayConfidencePercent(item)}%</Text>
            </View>
          </View>
          <Text style={styles.evidence}>{aiCandidateDisplaySourceText(item)}</Text>
          {aiCandidateDisplayIsLowConfidence(item) ? (
            <Text style={styles.warningText}>{lowConfidenceText}</Text>
          ) : null}
          {aiCandidateDisplayDecisionTrace(item) ? (
            <Text style={styles.evidence}>{aiCandidateDisplayDecisionTrace(item)}</Text>
          ) : null}
          <AiCandidateActionRow
            editAccessibilityLabel={aiCandidateEditAccessibilityLabel(item)}
            editLabel={editLabel}
            onEditPress={() => pressAiCandidateEditAction(item, onEditCandidate)}
            onRemovePress={() => pressAiCandidateRemoveAction(item, onRemoveCandidate)}
            removeAccessibilityLabel={aiCandidateRemoveAccessibilityLabel(item)}
            removeLabel={removeLabel}
          />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  aiReviewCardStack: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D6EEE4",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  confidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  confidencePill: {
    alignItems: "center",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  historyItemTitle: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10
  },
  iconCircleSmall: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  recordHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  timelineContent: {
    flex: 1,
    gap: 3
  },
  warningText: {
    color: "#C85D5D",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  }
});
