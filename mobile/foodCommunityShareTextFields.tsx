import type { ReactNode } from "react";
import { StyleSheet, TextInput } from "react-native";

type FoodCommunityShareTextFieldsProps = {
  afterGlucoseAccessibilityLabel: string;
  afterGlucoseValue: string;
  beforeGlucoseAccessibilityLabel: string;
  beforeGlucoseValue: string;
  dateTimeFields: ReactNode;
  foodNameAccessibilityLabel: string;
  foodNameMaxLength: number;
  foodNameValue: string;
  noteAccessibilityLabel: string;
  noteMaxLength: number;
  noteValue: string;
  onAfterGlucoseChange: (value: string) => void;
  onBeforeGlucoseChange: (value: string) => void;
  onFoodNameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
};

export function FoodCommunityShareTextFields({
  afterGlucoseAccessibilityLabel,
  afterGlucoseValue,
  beforeGlucoseAccessibilityLabel,
  beforeGlucoseValue,
  dateTimeFields,
  foodNameAccessibilityLabel,
  foodNameMaxLength,
  foodNameValue,
  noteAccessibilityLabel,
  noteMaxLength,
  noteValue,
  onAfterGlucoseChange,
  onBeforeGlucoseChange,
  onFoodNameChange,
  onNoteChange
}: FoodCommunityShareTextFieldsProps) {
  return (
    <>
      <TextInput
        accessibilityLabel={foodNameAccessibilityLabel}
        value={foodNameValue}
        onChangeText={onFoodNameChange}
        maxLength={foodNameMaxLength}
        style={styles.input}
        placeholder="食物名稱"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {dateTimeFields}
      <TextInput
        accessibilityLabel={beforeGlucoseAccessibilityLabel}
        value={beforeGlucoseValue}
        onChangeText={onBeforeGlucoseChange}
        keyboardType="numeric"
        maxLength={3}
        style={styles.input}
        placeholder="食用前血糖"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        accessibilityLabel={afterGlucoseAccessibilityLabel}
        value={afterGlucoseValue}
        onChangeText={onAfterGlucoseChange}
        keyboardType="numeric"
        maxLength={3}
        style={styles.input}
        placeholder="食用後血糖"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        accessibilityLabel={noteAccessibilityLabel}
        value={noteValue}
        onChangeText={onNoteChange}
        maxLength={noteMaxLength}
        style={[styles.input, styles.multilineField]}
        placeholder="備註心得"
        multiline
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
  multilineField: {
    lineHeight: 22,
    minHeight: 96
  }
});
