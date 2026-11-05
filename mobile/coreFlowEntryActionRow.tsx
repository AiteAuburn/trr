import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

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
  showFillSample: boolean;
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
  onNextPress,
  showFillSample
}: CoreFlowEntryActionRowProps) {
  return (
    <View style={styles.actionRow}>
      {showFillSample ? (
        <Pressable
          accessibilityLabel={fillSampleAccessibilityLabel}
          accessibilityRole="button"
          onPress={onFillSamplePress}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>{fillSampleLabel}</Text>
        </Pressable>
      ) : null}
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
    backgroundColor: palette.brand,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: palette.surface,
    fontSize: 14,
    fontWeight: "800"
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
