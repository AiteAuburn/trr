import { Pressable, StyleSheet, Text, View } from "react-native";

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
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
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
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: "#0F3F37",
    fontSize: 20,
    fontWeight: "800"
  }
});
