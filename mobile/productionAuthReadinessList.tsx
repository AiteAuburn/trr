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
    color: "#5F666A",
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
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
