import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type CommunityActionRowProps = {
  isShareDisabled: boolean;
  onPostPress: () => void;
  onPrivacyPress: () => void;
  onSharePress: () => void;
  postAccessibilityLabel: string;
  postLabel: string;
  privacyAccessibilityLabel: string;
  privacyLabel: string;
  shareAccessibilityLabel: string;
  shareLabel: string;
};

export function CommunityActionRow({
  isShareDisabled,
  onPostPress,
  onPrivacyPress,
  onSharePress,
  postAccessibilityLabel,
  postLabel,
  privacyAccessibilityLabel,
  privacyLabel,
  shareAccessibilityLabel,
  shareLabel
}: CommunityActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <Pressable
        accessibilityLabel={shareAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isShareDisabled }}
        disabled={isShareDisabled}
        onPress={onSharePress}
        style={[styles.secondaryButton, isShareDisabled ? styles.buttonDisabled : null]}
      >
        <Text style={styles.secondaryButtonText}>{shareLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={postAccessibilityLabel}
        accessibilityRole="button"
        onPress={onPostPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{postLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={privacyAccessibilityLabel}
        accessibilityRole="button"
        onPress={onPrivacyPress}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{privacyLabel}</Text>
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
