import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

export type SettingsProfileChoiceItem = {
  accessibilityLabel: string;
  id: string;
  label: string;
  sourceId: string;
};

type SettingsProfileChoiceSelectorProps = {
  activeProfileId: string;
  disabled: boolean;
  items: SettingsProfileChoiceItem[];
  onProfilePress: (item: SettingsProfileChoiceItem) => void;
};

export function SettingsProfileChoiceSelector({
  activeProfileId,
  disabled,
  items,
  onProfilePress
}: SettingsProfileChoiceSelectorProps) {
  return (
    <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
      {items.map((profile) => {
        const profileSelected = profile.sourceId === activeProfileId;
        return (
          <Pressable
            accessibilityLabel={profile.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled, selected: profileSelected }}
            disabled={disabled}
            key={profile.id}
            onPress={() => onProfilePress(profile)}
            style={[
              styles.chip,
              profileSelected ? styles.chipSelected : null,
              disabled ? styles.chipDisabled : null
            ]}
          >
            <Text style={[styles.chipText, profileSelected ? styles.chipTextSelected : null]}>
              {profile.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipDisabled: {
    backgroundColor: "#F1F3F2",
    opacity: 0.55
  },
  chipSelected: {
    backgroundColor: "#3FA67F",
    borderColor: "#3FA67F"
  },
  chipText: {
    color: "#0F3F37",
    fontSize: 13,
    fontWeight: "800"
  },
  chipTextSelected: {
    color: "#ffffff"
  }
});
