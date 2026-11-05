import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type TranscriptReviewActionRowProps = {
  isSubmitDisabled: boolean;
  onRetryPress: () => void;
  onSubmitPress: () => void;
  retryAccessibilityLabel: string;
  retryLabel: string;
  submitAccessibilityLabel: string;
  submitLabel: string;
};

export function TranscriptReviewActionRow({
  isSubmitDisabled,
  onRetryPress,
  onSubmitPress,
  retryAccessibilityLabel,
  retryLabel,
  submitAccessibilityLabel,
  submitLabel
}: TranscriptReviewActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={retryAccessibilityLabel}
        accessibilityRole="button"
        onPress={onRetryPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{retryLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={submitAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isSubmitDisabled }}
        disabled={isSubmitDisabled}
        onPress={onSubmitPress}
        style={[styles.primaryButton, isSubmitDisabled ? styles.buttonDisabled : null]}
      >
        <Text style={styles.primaryButtonText}>{submitLabel}</Text>
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
