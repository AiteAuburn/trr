import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type HistorySyncBoundaryBlockProps = {
  body: string;
  canLoadMoreRecords: boolean;
  loadMoreAccessibilityLabel: string;
  loadMoreLabel: string;
  title: string;
  onLoadMore: () => void;
};

export function HistorySyncBoundaryBlock({
  body,
  canLoadMoreRecords,
  loadMoreAccessibilityLabel,
  loadMoreLabel,
  title,
  onLoadMore
}: HistorySyncBoundaryBlockProps) {
  return (
    <View style={styles.inlineInfoBlock}>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.evidence}>{body}</Text>
      <Pressable
        accessibilityLabel={loadMoreAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canLoadMoreRecords }}
        style={[styles.secondaryButton, !canLoadMoreRecords ? styles.buttonDisabled : null]}
        disabled={!canLoadMoreRecords}
        onPress={onLoadMore}
      >
        <Text style={styles.secondaryButtonText}>{loadMoreLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.45
  },
  evidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  inlineInfoBlock: {
    gap: 8,
    paddingVertical: 2
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: palette.wash,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  }
});
