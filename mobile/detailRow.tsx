import { palette } from "./designTokens";
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
    backgroundColor: palette.subtle,
    borderColor: palette.accentBorder,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    padding: 14
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  recordContent: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  }
});
