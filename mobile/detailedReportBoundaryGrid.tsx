import { StyleSheet, Text, View } from "react-native";

export type DetailedReportBoundaryRow = {
  label: string;
  value: string;
};

type DetailedReportBoundaryGridProps = {
  rows: DetailedReportBoundaryRow[];
};

function detailedReportBoundaryRowKey(row: DetailedReportBoundaryRow) {
  return row.label;
}

function detailedReportBoundaryRowLabel(row: DetailedReportBoundaryRow) {
  return row.label;
}

function detailedReportBoundaryRowValue(row: DetailedReportBoundaryRow) {
  return row.value;
}

export function DetailedReportBoundaryGrid({ rows }: DetailedReportBoundaryGridProps) {
  return (
    <View style={styles.reportBoundaryGrid}>
      {rows.map((row) => (
        <View key={detailedReportBoundaryRowKey(row)} style={styles.reportBoundaryCard}>
          <Text style={styles.confidence}>{detailedReportBoundaryRowLabel(row)}</Text>
          <Text style={styles.recordType}>{detailedReportBoundaryRowValue(row)}</Text>
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
