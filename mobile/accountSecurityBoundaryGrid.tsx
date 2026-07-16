import { StyleSheet, Text, View } from "react-native";

export type AccountSecurityBoundaryRow = {
  label: string;
  value: string;
};

type AccountSecurityBoundaryGridProps = {
  rows: AccountSecurityBoundaryRow[];
};

function accountSecurityBoundaryRowKey(row: AccountSecurityBoundaryRow) {
  return row.label;
}

function accountSecurityBoundaryRowLabel(row: AccountSecurityBoundaryRow) {
  return row.label;
}

function accountSecurityBoundaryRowValue(row: AccountSecurityBoundaryRow) {
  return row.value;
}

export function AccountSecurityBoundaryGrid({ rows }: AccountSecurityBoundaryGridProps) {
  return (
    <View style={styles.reportBoundaryGrid}>
      {rows.map((row) => (
        <View key={accountSecurityBoundaryRowKey(row)} style={styles.reportBoundaryCard}>
          <Text style={styles.confidence}>{accountSecurityBoundaryRowLabel(row)}</Text>
          <Text style={styles.recordType}>{accountSecurityBoundaryRowValue(row)}</Text>
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
