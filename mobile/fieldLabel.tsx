import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";

type FieldLabelProps = {
  icon: string;
  label: string;
};

export function FieldLabel({ icon, label }: FieldLabelProps) {
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabelIcon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  fieldLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  fieldLabelIcon: {
    color: palette.brand,
    fontSize: 15,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center"
  }
});
