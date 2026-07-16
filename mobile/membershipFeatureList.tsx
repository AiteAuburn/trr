import { StyleSheet, Text, View } from "react-native";

export type MembershipFeatureRow = {
  label: string;
  value: string;
};

type MembershipFeatureListProps = {
  rows: MembershipFeatureRow[];
};

function membershipFeatureRowKey(row: MembershipFeatureRow) {
  return row.label;
}

function membershipFeatureRowLabel(row: MembershipFeatureRow) {
  return row.label;
}

function membershipFeatureRowValue(row: MembershipFeatureRow) {
  return row.value;
}

export function MembershipFeatureList({ rows }: MembershipFeatureListProps) {
  return (
    <>
      {rows.map((row) => (
        <View key={membershipFeatureRowKey(row)} style={styles.detailRow}>
          <Text style={styles.confidence}>{membershipFeatureRowLabel(row)}</Text>
          <Text style={styles.recordContent}>{membershipFeatureRowValue(row)}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  confidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  detailRow: {
    alignItems: "flex-start",
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    padding: 14
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  }
});
