import { palette } from "./designTokens";
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
        <View
          key={aiCandidateDisplayKey(item)}
          style={[styles.aiReviewCardStack, aiCandidateDisplayIsLowConfidence(item) ? styles.aiReviewCardUncertain : null]}
        >
          <View style={styles.recordHeader}>
            <View style={styles.iconCircleSmall}>
              <Text>{aiCandidateDisplayIcon(item)}</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.confidence}>{aiCandidateDisplayTypeLabel(item)}</Text>
              <Text style={styles.recordContent}>{aiCandidateDisplayPayloadSummary(item)}</Text>
            </View>
          </View>
          {aiCandidateDisplayIsLowConfidence(item) ? (
            <View style={styles.uncertainRow}>
              <Text style={styles.uncertainIcon}>!</Text>
              <Text style={styles.warningText}>{lowConfidenceText}</Text>
            </View>
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
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  aiReviewCardUncertain: {
    backgroundColor: palette.warningWash,
    borderColor: palette.warningBorder
  },
  confidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
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
    height: 44,
    justifyContent: "center",
    width: 44
  },
  recordContent: {
    color: palette.ink,
    flexShrink: 1,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28
  },
  recordHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  timelineContent: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  uncertainIcon: {
    borderColor: palette.warning,
    borderRadius: 9,
    borderWidth: 1.5,
    color: palette.warning,
    fontSize: 12,
    fontWeight: "800",
    height: 18,
    lineHeight: 15,
    textAlign: "center",
    width: 18
  },
  uncertainRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  warningText: {
    color: palette.warning,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 21
  }
});
