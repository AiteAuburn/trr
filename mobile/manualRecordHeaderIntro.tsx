import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

type ManualRecordHeaderIntroProps = {
  backAccessibilityLabel: string;
  backLabel: string;
  introText: string;
  title: string;
  onBackPress: () => void;
};

export function ManualRecordHeaderIntro({
  backAccessibilityLabel,
  backLabel,
  introText,
  title,
  onBackPress
}: ManualRecordHeaderIntroProps) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable
          accessibilityLabel={backAccessibilityLabel}
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={onBackPress}
        >
          <Text style={styles.secondaryButtonText}>{backLabel}</Text>
        </Pressable>
      </View>
      <Text style={styles.evidence}>{introText}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  evidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
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
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: "800"
  }
});
