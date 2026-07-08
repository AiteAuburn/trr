import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { FieldLabel } from "./fieldLabel";

type ManualRecordGlucoseOption = {
  accessibilityLabel: string;
  label: string;
  value: string;
};

type ManualRecordGlucoseFieldsProps<TUnit extends ManualRecordGlucoseOption, TTiming extends ManualRecordGlucoseOption> = {
  glucoseTiming: string;
  glucoseValue: string;
  glucoseValueAccessibilityLabel: string;
  glucoseValueMaxLength: number;
  glucoseUnit: string;
  timingOptions: TTiming[];
  unitOptions: TUnit[];
  onGlucoseValueChange: (value: string) => void;
  onTimingPress: (option: TTiming) => void;
  onUnitPress: (option: TUnit) => void;
};

export function ManualRecordGlucoseFields<TUnit extends ManualRecordGlucoseOption, TTiming extends ManualRecordGlucoseOption>({
  glucoseTiming,
  glucoseValue,
  glucoseValueAccessibilityLabel,
  glucoseValueMaxLength,
  glucoseUnit,
  timingOptions,
  unitOptions,
  onGlucoseValueChange,
  onTimingPress,
  onUnitPress
}: ManualRecordGlucoseFieldsProps<TUnit, TTiming>) {
  return (
    <>
      <View style={styles.formField}>
        <FieldLabel icon={"💧"} label={"血糖數值"} />
        <TextInput
          accessibilityLabel={glucoseValueAccessibilityLabel}
          value={glucoseValue}
          onChangeText={onGlucoseValueChange}
          keyboardType="numeric"
          maxLength={glucoseValueMaxLength}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="138"
        />
      </View>
      <View style={styles.segmentRow}>
        {unitOptions.map((option) => (
          <Pressable
            key={option.value}
            accessibilityLabel={option.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: glucoseUnit === option.value }}
            style={[styles.segmentPill, glucoseUnit === option.value ? styles.segmentActive : null]}
            onPress={() => onUnitPress(option)}
          >
            <Text style={[styles.segmentText, glucoseUnit === option.value ? styles.segmentTextActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.formField}>
        <FieldLabel icon={"◌"} label={"情境"} />
        <View style={styles.segmentRow}>
          {timingOptions.map((option) => (
            <Pressable
              key={option.value}
              accessibilityLabel={option.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: glucoseTiming === option.value }}
              style={[styles.segmentPill, glucoseTiming === option.value ? styles.segmentActive : null]}
              onPress={() => onTimingPress(option)}
            >
              <Text style={[styles.segmentText, glucoseTiming === option.value ? styles.segmentTextActive : null]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  formField: {
    gap: 8
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
  },
  segmentActive: {
    backgroundColor: "#3FA67F",
    borderColor: "#3FA67F"
  },
  segmentPill: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  segmentText: {
    color: "#0F3F37",
    fontSize: 13,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: "#FFFFFF"
  }
});
