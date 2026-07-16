import { StyleSheet, Text, View } from "react-native";

export type SubscriptionComparisonRow = {
  annual: string;
  feature: string;
  trial: string;
};

type SubscriptionComparisonListProps = {
  rows: SubscriptionComparisonRow[];
};

function subscriptionComparisonRowKey(row: SubscriptionComparisonRow) {
  return row.feature;
}

function subscriptionComparisonRowFeature(row: SubscriptionComparisonRow) {
  return row.feature;
}

function subscriptionComparisonRowTrial(row: SubscriptionComparisonRow) {
  return row.trial;
}

function subscriptionComparisonRowAnnual(row: SubscriptionComparisonRow) {
  return row.annual;
}

export function SubscriptionComparisonList({ rows }: SubscriptionComparisonListProps) {
  return (
    <>
      {rows.map((row) => (
        <View key={subscriptionComparisonRowKey(row)} style={styles.comparisonRow}>
          <Text style={styles.comparisonFeature}>{subscriptionComparisonRowFeature(row)}</Text>
          <Text style={styles.comparisonCell}>{subscriptionComparisonRowTrial(row)}</Text>
          <Text style={styles.comparisonCellStrong}>{subscriptionComparisonRowAnnual(row)}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  comparisonCell: {
    color: "#5F666A",
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    minWidth: 74,
    textAlign: "center"
  },
  comparisonCellStrong: {
    color: "#3FA67F",
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
    minWidth: 74,
    textAlign: "center"
  },
  comparisonFeature: {
    color: "#0F3F37",
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "900",
    minWidth: 86
  },
  comparisonRow: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12
  }
});
