import { palette } from "./designTokens";
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
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  recordType: {
    color: palette.brand,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  reportBoundaryCard: {
    backgroundColor: palette.subtle,
    borderColor: palette.accentBorder,
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
