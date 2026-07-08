import { Pressable, StyleSheet, Text, View } from "react-native";

type ManualRecordTypeOption = {
  accessibilityLabel: string;
  label: string;
  value: string;
};

type ManualRecordTypeSelectorProps<T extends ManualRecordTypeOption> = {
  options: T[];
  selectedValue: string;
  onTypePress: (type: T) => void;
};

export function ManualRecordTypeSelector<T extends ManualRecordTypeOption>({
  options,
  selectedValue,
  onTypePress
}: ManualRecordTypeSelectorProps<T>) {
  return (
    <View style={styles.segmentRow}>
      {options.map((type) => (
        <Pressable
          key={type.value}
          accessibilityLabel={type.accessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedValue === type.value }}
          style={[styles.segmentPill, selectedValue === type.value ? styles.segmentActive : null]}
          onPress={() => onTypePress(type)}
        >
          <Text style={[styles.segmentText, selectedValue === type.value ? styles.segmentTextActive : null]}>
            {type.label}
          </Text>
        </Pressable>
      ))}
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
