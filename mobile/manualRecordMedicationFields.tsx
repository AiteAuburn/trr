import { RecordTextField } from "./recordTextField";

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
      <RecordTextField
        icon={"💊"}
        label={"用藥"}
        accessibilityLabel={nameAccessibilityLabel}
        value={name}
        onChangeText={onNameChange}
        maxLength={nameMaxLength}
        placeholder="藥名或胰島素描述"
      />
      <RecordTextField
        icon={"▣"}
        label={"劑量"}
        accessibilityLabel={doseAccessibilityLabel}
        value={dose}
        onChangeText={onDoseChange}
        maxLength={doseMaxLength}
        placeholder="例如：1 顆、8u"
      />
    </>
  );
}
