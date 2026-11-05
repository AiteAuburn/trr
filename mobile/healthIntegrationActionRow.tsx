import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type HealthIntegrationActionRowProps = {
  meterAccessibilityLabel: string;
  meterLabel: string;
  onMeterPress: () => void;
  onPermissionPress: () => void;
  permissionAccessibilityLabel: string;
  permissionLabel: string;
};

export function HealthIntegrationActionRow({
  meterAccessibilityLabel,
  meterLabel,
  onMeterPress,
  onPermissionPress,
  permissionAccessibilityLabel,
  permissionLabel
}: HealthIntegrationActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={permissionAccessibilityLabel}
        accessibilityRole="button"
        onPress={onPermissionPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{permissionLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={meterAccessibilityLabel}
        accessibilityRole="button"
        onPress={onMeterPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{meterLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: palette.wash,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  }
});
