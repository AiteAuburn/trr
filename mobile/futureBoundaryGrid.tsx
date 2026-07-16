import { StyleSheet, Text, View } from "react-native";

export type FutureBoundaryRow = {
  label: string;
  value: string;
};

type FutureBoundaryGridProps = {
  rows: FutureBoundaryRow[];
};

function futureBoundaryRowKey(row: FutureBoundaryRow) {
  return row.label;
}

function futureBoundaryRowLabel(row: FutureBoundaryRow) {
  return row.label;
}

function futureBoundaryRowValue(row: FutureBoundaryRow) {
  return row.value;
}

export function FutureBoundaryGrid({ rows }: FutureBoundaryGridProps) {
  return (
    <View style={styles.reportBoundaryGrid}>
      {rows.map((row) => (
        <View key={futureBoundaryRowKey(row)} style={styles.reportBoundaryCard}>
          <Text style={styles.confidence}>{futureBoundaryRowLabel(row)}</Text>
          <Text style={styles.recordType}>{futureBoundaryRowValue(row)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  confidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  recordType: {
    color: "#3FA67F",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  reportBoundaryCard: {
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: "46%",
    padding: 12
  },
  reportBoundaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
});
