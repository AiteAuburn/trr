import { StyleSheet, TextInput, View } from "react-native";

import { FieldLabel } from "./fieldLabel";

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
      <View style={styles.formField}>
        <FieldLabel icon={"📝"} label={"備註類型"} />
        <TextInput
          accessibilityLabel={kindAccessibilityLabel}
          value={kind}
          onChangeText={onKindChange}
          maxLength={kindMaxLength}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="symptom"
        />
      </View>
      <View style={styles.formField}>
        <FieldLabel icon={"#"} label={"標籤"} />
        <TextInput
          accessibilityLabel={tagsAccessibilityLabel}
          value={tags}
          onChangeText={onTagsChange}
          maxLength={tagsMaxLength}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.multilineField]}
          placeholder="頭暈、疲倦"
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
  },
  multilineField: {
    lineHeight: 22,
    minHeight: 96
  }
});
