import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";

type MetricCardProps = {
  label: string;
  value: string;
};

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.confidence}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  confidence: {
    color: "#7C8581",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18
  },
  metricCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: "46%",
    padding: 14
  },
  metricValue: {
    color: palette.brand,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4
  }
});
