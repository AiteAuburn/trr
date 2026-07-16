import { StyleSheet, View } from "react-native";

import { MetricCard } from "./metricCard";

export type MetricGridRow = {
  label: string;
  value: string;
};

type MetricGridProps = {
  rows: MetricGridRow[];
};

function metricGridRowKey(row: MetricGridRow) {
  return row.label;
}

function metricGridRowLabel(row: MetricGridRow) {
  return row.label;
}

function metricGridRowValue(row: MetricGridRow) {
  return row.value;
}

export function MetricGrid({ rows }: MetricGridProps) {
  return (
    <View style={styles.metricGrid}>
      {rows.map((row) => (
        <MetricCard key={metricGridRowKey(row)} label={metricGridRowLabel(row)} value={metricGridRowValue(row)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
});
