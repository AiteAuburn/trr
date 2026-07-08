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
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 20,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: "46%",
    padding: 14
  },
  metricValue: {
    color: "#3FA67F",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4
  }
});
