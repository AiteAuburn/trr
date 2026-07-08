import { StyleSheet, TextInput, View } from "react-native";

import { FieldLabel } from "./fieldLabel";

type ManualRecordMedicationFieldsProps = {
  dose: string;
  doseAccessibilityLabel: string;
  doseMaxLength: number;
  name: string;
  nameAccessibilityLabel: string;
  nameMaxLength: number;
  onDoseChange: (value: string) => void;
  onNameChange: (value: string) => void;
};

export function ManualRecordMedicationFields({
  dose,
  doseAccessibilityLabel,
  doseMaxLength,
  name,
  nameAccessibilityLabel,
  nameMaxLength,
  onDoseChange,
  onNameChange
}: ManualRecordMedicationFieldsProps) {
  return (
    <>
      <View style={styles.formField}>
        <FieldLabel icon={"💊"} label={"用藥"} />
        <TextInput
          accessibilityLabel={nameAccessibilityLabel}
          value={name}
          onChangeText={onNameChange}
          maxLength={nameMaxLength}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="藥名或胰島素描述"
        />
      </View>
      <View style={styles.formField}>
        <FieldLabel icon={"▣"} label={"劑量"} />
        <TextInput
          accessibilityLabel={doseAccessibilityLabel}
          value={dose}
          onChangeText={onDoseChange}
          maxLength={doseMaxLength}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="例如：1 顆、8u"
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
