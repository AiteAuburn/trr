import { Pressable, StyleSheet, Text, View } from "react-native";

import { FieldLabel } from "./fieldLabel";
import { RecordTextField } from "./recordTextField";

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

function manualRecordGlucoseOptionKey(option: ManualRecordGlucoseOption) {
  return option.value;
}

function manualRecordGlucoseOptionAccessibilityLabel(option: ManualRecordGlucoseOption) {
  return option.accessibilityLabel;
}

function manualRecordGlucoseOptionLabel(option: ManualRecordGlucoseOption) {
  return option.label;
}

function manualRecordGlucoseOptionSelected(option: ManualRecordGlucoseOption, selectedValue: string) {
  return selectedValue === manualRecordGlucoseOptionKey(option);
}

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
      <RecordTextField
        icon={"💧"}
        label={"血糖數值"}
        accessibilityLabel={glucoseValueAccessibilityLabel}
        value={glucoseValue}
        onChangeText={onGlucoseValueChange}
        keyboardType="numeric"
        maxLength={glucoseValueMaxLength}
        placeholder="138"
      />
      <View style={styles.segmentRow}>
        {unitOptions.map((option) => {
          const optionSelected = manualRecordGlucoseOptionSelected(option, glucoseUnit);
          return (
            <Pressable
              key={manualRecordGlucoseOptionKey(option)}
              accessibilityLabel={manualRecordGlucoseOptionAccessibilityLabel(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: optionSelected }}
              style={[styles.segmentPill, optionSelected ? styles.segmentActive : null]}
              onPress={() => onUnitPress(option)}
            >
              <Text style={[styles.segmentText, optionSelected ? styles.segmentTextActive : null]}>
                {manualRecordGlucoseOptionLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.formField}>
        <FieldLabel icon={"◌"} label={"情境"} />
        <View style={styles.segmentRow}>
          {timingOptions.map((option) => {
            const optionSelected = manualRecordGlucoseOptionSelected(option, glucoseTiming);
            return (
              <Pressable
                key={manualRecordGlucoseOptionKey(option)}
                accessibilityLabel={manualRecordGlucoseOptionAccessibilityLabel(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: optionSelected }}
                style={[styles.segmentPill, optionSelected ? styles.segmentActive : null]}
                onPress={() => onTimingPress(option)}
              >
                <Text style={[styles.segmentText, optionSelected ? styles.segmentTextActive : null]}>
                  {manualRecordGlucoseOptionLabel(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  formField: {
    gap: 8
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
