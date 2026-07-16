import { Pressable, StyleSheet, Text, View } from "react-native";

type CoreFlowEntryActionRowProps = {
  fillSampleAccessibilityLabel: string;
  fillSampleLabel: string;
  isNextDisabled: boolean;
  manualAddAccessibilityLabel: string;
  manualAddLabel: string;
  nextAccessibilityLabel: string;
  nextLabel: string;
  onFillSamplePress: () => void;
  onManualAddPress: () => void;
  onNextPress: () => void;
};

export function CoreFlowEntryActionRow({
  fillSampleAccessibilityLabel,
  fillSampleLabel,
  isNextDisabled,
  manualAddAccessibilityLabel,
  manualAddLabel,
  nextAccessibilityLabel,
  nextLabel,
  onFillSamplePress,
  onManualAddPress,
  onNextPress
}: CoreFlowEntryActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={fillSampleAccessibilityLabel}
        accessibilityRole="button"
        onPress={onFillSamplePress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{fillSampleLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={manualAddAccessibilityLabel}
        accessibilityRole="button"
        onPress={onManualAddPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{manualAddLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={nextAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isNextDisabled }}
        disabled={isNextDisabled}
        onPress={onNextPress}
        style={[styles.primaryButton, isNextDisabled ? styles.buttonDisabled : null]}
      >
        <Text style={styles.primaryButtonText}>{nextLabel}</Text>
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
  buttonDisabled: {
    opacity: 0.55
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#3FA67F",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800"
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
