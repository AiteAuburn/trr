import { Pressable, StyleSheet, Text, View } from "react-native";

export type ManualRecordTypeOption<T extends string = string> = {
  accessibilityLabel: string;
  label: string;
  value: T;
};

type ManualRecordTypeSelectorProps<T extends ManualRecordTypeOption> = {
  options: T[];
  selectedValue: string;
  onTypePress: (type: T) => void;
};

function manualRecordTypeOptionKey(type: ManualRecordTypeOption) {
  return type.value;
}

export function manualRecordTypeTarget<T extends ManualRecordTypeOption>(type: T): T["value"] {
  return type.value;
}

function manualRecordTypeOptionAccessibilityLabel(type: ManualRecordTypeOption) {
  return type.accessibilityLabel;
}

function manualRecordTypeOptionLabel(type: ManualRecordTypeOption) {
  return type.label;
}

function manualRecordTypeOptionSelected(type: ManualRecordTypeOption, selectedValue: string) {
  return selectedValue === manualRecordTypeOptionKey(type);
}

export function ManualRecordTypeSelector<T extends ManualRecordTypeOption>({
  options,
  selectedValue,
  onTypePress
}: ManualRecordTypeSelectorProps<T>) {
  return (
    <View style={styles.segmentRow}>
      {options.map((type) => {
        const typeSelected = manualRecordTypeOptionSelected(type, selectedValue);
        return (
          <Pressable
            key={manualRecordTypeOptionKey(type)}
            accessibilityLabel={manualRecordTypeOptionAccessibilityLabel(type)}
            accessibilityRole="button"
            accessibilityState={{ selected: typeSelected }}
            style={[styles.segmentPill, typeSelected ? styles.segmentActive : null]}
            onPress={() => onTypePress(type)}
          >
            <Text style={[styles.segmentText, typeSelected ? styles.segmentTextActive : null]}>
              {manualRecordTypeOptionLabel(type)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
