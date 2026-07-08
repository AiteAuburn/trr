import { Pressable, StyleSheet, Text, View } from "react-native";

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
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  inlineInfoBlock: {
    gap: 8,
    paddingVertical: 2
  },
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  secondaryButtonText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  }
});
