import { palette } from "./designTokens";
import { ScrollView, StyleSheet, Text } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

export type SettingsModelChoiceItem = {
  accessibilityLabel: string;
  available: boolean;
  id: string;
  label: string;
  sourceId: string;
};

export function settingsModelChoiceTarget(model: SettingsModelChoiceItem) {
  return model.sourceId;
}

type SettingsModelChoiceSelectorProps<Item extends SettingsModelChoiceItem> = {
  disabled: boolean;
  items: Item[];
  onModelPress: (item: Item) => void;
  selectedModelId: string;
};

export function SettingsModelChoiceSelector<Item extends SettingsModelChoiceItem>({
  disabled,
  items,
  onModelPress,
  selectedModelId
}: SettingsModelChoiceSelectorProps<Item>) {
  return (
    <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
      {items.map((model) => {
        const modelDisabled = !model.available || disabled;
        const modelSelected = model.sourceId === selectedModelId;
        return (
          <Pressable
            accessibilityLabel={model.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: modelDisabled, selected: modelSelected }}
            disabled={modelDisabled}
            key={model.id}
            onPress={() => onModelPress(model)}
            style={[
              styles.chip,
              modelSelected ? styles.chipSelected : null,
              modelDisabled ? styles.chipDisabled : null
            ]}
          >
            <Text
              style={[
                styles.chipText,
                modelSelected ? styles.chipTextSelected : null,
                !model.available ? styles.chipTextDisabled : null
              ]}
            >
              {model.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipDisabled: {
    backgroundColor: palette.neutral,
    opacity: 0.55
  },
  chipSelected: {
    backgroundColor: palette.brand,
    borderColor: palette.brand
  },
  chipText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  chipTextDisabled: {
    color: palette.secondary
  },
  chipTextSelected: {
    color: palette.surface
  }
});
