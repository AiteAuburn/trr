import { StyleSheet, TextInput, View } from "react-native";

import { FieldLabel } from "./fieldLabel";

type ManualRecordDateTimeFieldsProps = {
  dateAccessibilityLabel: string;
  dateMaxLength: number;
  dateValue: string;
  timeAccessibilityLabel: string;
  timeMaxLength: number;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
};

export function ManualRecordDateTimeFields({
  dateAccessibilityLabel,
  dateMaxLength,
  dateValue,
  timeAccessibilityLabel,
  timeMaxLength,
  timeValue,
  onDateChange,
  onTimeChange
}: ManualRecordDateTimeFieldsProps) {
  return (
    <View style={styles.dateTimeRow}>
      <View style={styles.dateTimeField}>
        <FieldLabel icon={"📅"} label={"日期"} />
        <TextInput
          accessibilityLabel={dateAccessibilityLabel}
          value={dateValue}
          onChangeText={onDateChange}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={dateMaxLength}
          style={styles.input}
          placeholder="2026-04-29"
        />
      </View>
      <View style={styles.dateTimeField}>
        <FieldLabel icon={"🕒"} label={"時間"} />
        <TextInput
          accessibilityLabel={timeAccessibilityLabel}
          value={timeValue}
          onChangeText={onTimeChange}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={timeMaxLength}
          style={styles.input}
          placeholder="08:10"
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
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12
  }
});
