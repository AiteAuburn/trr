import { StyleSheet, TextInput, View } from "react-native";

import { FieldLabel } from "./fieldLabel";

type AnalysisCustomDateRangeFieldsProps = {
  endAccessibilityLabel: string;
  endMaxLength: number;
  endValue: string;
  onEndChange: (value: string) => void;
  onStartChange: (value: string) => void;
  startAccessibilityLabel: string;
  startMaxLength: number;
  startValue: string;
};

export function AnalysisCustomDateRangeFields({
  endAccessibilityLabel,
  endMaxLength,
  endValue,
  onEndChange,
  onStartChange,
  startAccessibilityLabel,
  startMaxLength,
  startValue
}: AnalysisCustomDateRangeFieldsProps) {
  return (
    <View style={styles.dateTimeRow}>
      <View style={styles.dateTimeField}>
        <FieldLabel icon={"📅"} label={"開始日期"} />
        <TextInput
          accessibilityLabel={startAccessibilityLabel}
          value={startValue}
          onChangeText={onStartChange}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={startMaxLength}
          style={styles.input}
          placeholder="2026-04-01"
        />
      </View>
      <View style={styles.dateTimeField}>
        <FieldLabel icon={"📅"} label={"結束日期"} />
        <TextInput
          accessibilityLabel={endAccessibilityLabel}
          value={endValue}
          onChangeText={onEndChange}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={endMaxLength}
          style={styles.input}
          placeholder="2026-04-30"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dateTimeField: {
    flex: 1,
    gap: 8
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    color: "#1E1E1E",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  }
});
