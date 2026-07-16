import { StyleSheet, Text, View } from "react-native";

export type SettingsBoundaryRow = {
  label: string;
  value: string;
};

type SettingsBoundaryGridProps = {
  rows: SettingsBoundaryRow[];
};

function settingsBoundaryRowKey(row: SettingsBoundaryRow) {
  return row.label;
}

function settingsBoundaryRowLabel(row: SettingsBoundaryRow) {
  return row.label;
}

function settingsBoundaryRowValue(row: SettingsBoundaryRow) {
  return row.value;
}

export function SettingsBoundaryGrid({ rows }: SettingsBoundaryGridProps) {
  return (
    <View style={styles.reportBoundaryGrid}>
      {rows.map((row) => (
        <View key={settingsBoundaryRowKey(row)} style={styles.reportBoundaryCard}>
          <Text style={styles.confidence}>{settingsBoundaryRowLabel(row)}</Text>
          <Text style={styles.recordType}>{settingsBoundaryRowValue(row)}</Text>
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
