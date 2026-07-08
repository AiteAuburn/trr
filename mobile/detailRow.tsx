import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type DetailRowProps = {
  label: ReactNode;
  value: string;
};

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      {typeof label === "string" ? <Text style={styles.label}>{label}</Text> : label}
      <Text style={styles.recordContent}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  recordContent: {
    color: "#29302E",
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right"
  }
});
