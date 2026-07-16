import { StyleSheet, Text, View } from "react-native";

import { FieldLabel } from "./fieldLabel";
import { RecordTextField } from "./recordTextField";

type RecordEditHeaderFieldsProps = {
  dateAccessibilityLabel: string;
  dateMaxLength: number;
  dateValue: string;
  timeAccessibilityLabel: string;
  timeMaxLength: number;
  timeValue: string;
  typeLabel: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
};

export function RecordEditHeaderFields({
  dateAccessibilityLabel,
  dateMaxLength,
  dateValue,
  timeAccessibilityLabel,
  timeMaxLength,
  timeValue,
  typeLabel,
  onDateChange,
  onTimeChange
}: RecordEditHeaderFieldsProps) {
  return (
    <View style={styles.detailRows}>
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeField}>
          <RecordTextField
            icon={"📅"}
            label={"日期"}
            accessibilityLabel={dateAccessibilityLabel}
            value={dateValue}
            onChangeText={onDateChange}
            maxLength={dateMaxLength}
            inputStyle={styles.input}
            placeholder="2026-04-29"
          />
        </View>
        <View style={styles.dateTimeField}>
          <RecordTextField
            icon={"🕒"}
            label={"時間"}
            accessibilityLabel={timeAccessibilityLabel}
            value={timeValue}
            onChangeText={onTimeChange}
            maxLength={timeMaxLength}
            inputStyle={styles.input}
            placeholder="08:10"
          />
        </View>
      </View>
      <View style={styles.detailRow}>
        <FieldLabel icon={"🏷"} label={"類型"} />
        <Text style={styles.recordContent}>{typeLabel}</Text>
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
  detailRows: {
    gap: 8,
    paddingVertical: 2
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
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  }
});
