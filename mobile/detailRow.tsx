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
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  }
});
