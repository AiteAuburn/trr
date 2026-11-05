import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";

export type ProductionAuthReadinessItem = {
  copy: string;
  statusLabel: string;
  title: string;
};

type ProductionAuthReadinessListProps = {
  items: ProductionAuthReadinessItem[];
};

function productionAuthReadinessItemKey(item: { title: string }) {
  return item.title;
}

export function ProductionAuthReadinessList({ items }: ProductionAuthReadinessListProps) {
  return (
    <>
      {items.map((item) => (
        <View key={productionAuthReadinessItemKey(item)} style={styles.highlightRow}>
          <Text style={styles.previewModeBadge}>{item.statusLabel}</Text>
          <View style={styles.timelineContent}>
            <Text style={styles.recordContent}>{item.title}</Text>
            <Text style={styles.evidence}>{item.copy}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  evidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  highlightRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10
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
