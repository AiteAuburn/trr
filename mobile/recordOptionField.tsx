import { Pressable, StyleSheet, Text, View } from "react-native";

import { FieldLabel } from "./fieldLabel";

type RecordOptionItem = {
  accessibilityLabel: string;
  label: string;
  value: string;
};

type RecordOptionFieldProps<TOption extends RecordOptionItem> = {
  icon: string;
  label: string;
  onOptionPress: (option: TOption) => void;
  options: readonly TOption[];
  selectedValue: string;
};

export function RecordOptionField<TOption extends RecordOptionItem>({
  icon,
  label,
  onOptionPress,
  options,
  selectedValue
}: RecordOptionFieldProps<TOption>) {
  return (
    <View style={styles.formField}>
      <FieldLabel icon={icon} label={label} />
      <View style={styles.segmentRow}>
        {options.map((option) => {
          const optionSelected = option.value === selectedValue;

          return (
            <Pressable
              key={option.value}
              accessibilityLabel={option.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: optionSelected }}
              style={[styles.segmentPill, optionSelected ? styles.segmentActive : null]}
              onPress={() => onOptionPress(option)}
            >
              <Text style={[styles.segmentText, optionSelected ? styles.segmentTextActive : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
