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

function manualRecordMealOptionKey(option: ManualRecordMealOption) {
  return option.value;
}

function manualRecordMealOptionAccessibilityLabel(option: ManualRecordMealOption) {
  return option.accessibilityLabel;
}

function manualRecordMealOptionLabel(option: ManualRecordMealOption) {
  return option.label;
}

function manualRecordMealOptionSelected(option: ManualRecordMealOption, mealType: string) {
  return mealType === manualRecordMealOptionKey(option);
}

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
          {mealTypeOptions.map((option) => {
            const optionSelected = manualRecordMealOptionSelected(option, mealType);
            return (
              <Pressable
                key={manualRecordMealOptionKey(option)}
                accessibilityLabel={manualRecordMealOptionAccessibilityLabel(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: optionSelected }}
                style={[styles.segmentPill, optionSelected ? styles.segmentActive : null]}
                onPress={() => onMealTypePress(option)}
              >
                <Text style={[styles.segmentText, optionSelected ? styles.segmentTextActive : null]}>
                  {manualRecordMealOptionLabel(option)}
                </Text>
              </Pressable>
            );
          })}
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
