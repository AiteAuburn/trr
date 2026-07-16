import { ManualRecordTextField } from "./manualRecordTextField";

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
      <ManualRecordTextField
        icon={"🚶"}
        label={"運動"}
        accessibilityLabel={activityAccessibilityLabel}
        value={activity}
        onChangeText={onActivityChange}
        maxLength={activityMaxLength}
        placeholder="走路"
      />
      <ManualRecordTextField
        icon={"⏱"}
        label={"時長（分鐘）"}
        accessibilityLabel={minutesAccessibilityLabel}
        value={minutes}
        onChangeText={onMinutesChange}
        keyboardType="numeric"
        maxLength={minutesMaxLength}
        placeholder="20"
      />
    </>
  );
}
