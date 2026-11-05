import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";

type HistorySelectedDateHeaderProps = {
  dateLabel: string;
  storageLabel: string;
};

export function HistorySelectedDateHeader({ dateLabel, storageLabel }: HistorySelectedDateHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.label}>{dateLabel}</Text>
        <Text style={styles.evidence}>{storageLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  evidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  }
});
