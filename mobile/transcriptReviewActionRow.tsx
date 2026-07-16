import { Pressable, StyleSheet, Text, View } from "react-native";

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
