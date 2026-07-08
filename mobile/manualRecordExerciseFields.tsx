import { StyleSheet, TextInput, View } from "react-native";

import { FieldLabel } from "./fieldLabel";

type ManualRecordExerciseFieldsProps = {
  activity: string;
  activityAccessibilityLabel: string;
  activityMaxLength: number;
  minutes: string;
  minutesAccessibilityLabel: string;
  minutesMaxLength: number;
  onActivityChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
};

export function ManualRecordExerciseFields({
  activity,
  activityAccessibilityLabel,
  activityMaxLength,
  minutes,
  minutesAccessibilityLabel,
  minutesMaxLength,
  onActivityChange,
  onMinutesChange
}: ManualRecordExerciseFieldsProps) {
  return (
    <>
      <View style={styles.formField}>
        <FieldLabel icon={"🚶"} label={"運動"} />
        <TextInput
          accessibilityLabel={activityAccessibilityLabel}
          value={activity}
          onChangeText={onActivityChange}
          maxLength={activityMaxLength}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="走路"
        />
      </View>
      <View style={styles.formField}>
        <FieldLabel icon={"⏱"} label={"時長（分鐘）"} />
        <TextInput
          accessibilityLabel={minutesAccessibilityLabel}
          value={minutes}
          onChangeText={onMinutesChange}
          keyboardType="numeric"
          maxLength={minutesMaxLength}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="20"
        />
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
  }
});
