import { Pressable, StyleSheet, Text, View } from "react-native";

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
    backgroundColor: "#EAF6F1",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  secondaryButtonText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  }
});
