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
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  fieldLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  fieldLabelIcon: {
    color: "#3FA67F",
    fontSize: 15,
    fontWeight: "900",
    minWidth: 20,
    textAlign: "center"
  }
});
