import { palette } from "./designTokens";
import { StyleSheet, Text } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type SettingsSubpageCloseButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
};

export function SettingsSubpageCloseButton({
  accessibilityLabel,
  onPress
}: SettingsSubpageCloseButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.closeButton}
    >
      <Text style={styles.closeButtonText}>×</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    backgroundColor: palette.wash,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  closeButtonText: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 30
  }
});
