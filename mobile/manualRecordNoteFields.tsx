import { RecordTextField, recordTextFieldStyles } from "./recordTextField";

type ManualRecordNoteFieldsProps = {
  kind: string;
  kindAccessibilityLabel: string;
  kindMaxLength: number;
  onKindChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  tags: string;
  tagsAccessibilityLabel: string;
  tagsMaxLength: number;
};

export function ManualRecordNoteFields({
  kind,
  kindAccessibilityLabel,
  kindMaxLength,
  onKindChange,
  onTagsChange,
  tags,
  tagsAccessibilityLabel,
  tagsMaxLength
}: ManualRecordNoteFieldsProps) {
  return (
    <>
      <RecordTextField
        icon={"📝"}
        label={"備註類型"}
        accessibilityLabel={kindAccessibilityLabel}
        value={kind}
        onChangeText={onKindChange}
        maxLength={kindMaxLength}
        placeholder="symptom"
      />
      <RecordTextField
        icon={"#"}
        label={"標籤"}
        accessibilityLabel={tagsAccessibilityLabel}
        value={tags}
        onChangeText={onTagsChange}
        maxLength={tagsMaxLength}
        multiline
        textAlignVertical="top"
        inputStyle={[recordTextFieldStyles.input, recordTextFieldStyles.multilineField]}
        placeholder="頭暈、疲倦"
      />
    </>
  );
}
