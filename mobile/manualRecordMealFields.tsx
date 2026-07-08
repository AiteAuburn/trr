import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { FieldLabel } from "./fieldLabel";

type ManualRecordMealOption = {
  accessibilityLabel: string;
  label: string;
  value: string;
};

type ManualRecordMealFieldsProps<TMeal extends ManualRecordMealOption> = {
  foodItems: string;
  foodItemsAccessibilityLabel: string;
  foodItemsMaxLength: number;
  mealType: string;
  mealTypeOptions: TMeal[];
  onFoodItemsChange: (value: string) => void;
  onMealTypePress: (option: TMeal) => void;
};

export function ManualRecordMealFields<TMeal extends ManualRecordMealOption>({
  foodItems,
  foodItemsAccessibilityLabel,
  foodItemsMaxLength,
  mealType,
  mealTypeOptions,
  onFoodItemsChange,
  onMealTypePress
}: ManualRecordMealFieldsProps<TMeal>) {
  return (
    <>
      <View style={styles.formField}>
        <FieldLabel icon={"🥣"} label={"餐別"} />
        <View style={styles.segmentRow}>
          {mealTypeOptions.map((option) => (
            <Pressable
              key={option.value}
              accessibilityLabel={option.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: mealType === option.value }}
              style={[styles.segmentPill, mealType === option.value ? styles.segmentActive : null]}
              onPress={() => onMealTypePress(option)}
            >
              <Text style={[styles.segmentText, mealType === option.value ? styles.segmentTextActive : null]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.formField}>
        <FieldLabel icon={"🍽"} label={"飲食內容"} />
        <TextInput
          accessibilityLabel={foodItemsAccessibilityLabel}
          value={foodItems}
          onChangeText={onFoodItemsChange}
          maxLength={foodItemsMaxLength}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.multilineField]}
          placeholder="水煮蛋、熱狗"
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
