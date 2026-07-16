import { Pressable, StyleSheet, Text, View } from "react-native";

type UpdateSuccessActionRowProps = {
  detailAccessibilityLabel: string;
  detailLabel: string;
  onDetailPress: () => void;
  onReturnPress: () => void;
  returnAccessibilityLabel: string;
  returnLabel: string;
  showDetail: boolean;
};

export function UpdateSuccessActionRow({
  detailAccessibilityLabel,
  detailLabel,
  onDetailPress,
  onReturnPress,
  returnAccessibilityLabel,
  returnLabel,
  showDetail
}: UpdateSuccessActionRowProps) {
  return (
    <View style={styles.actionRow}>
      {showDetail ? (
        <Pressable
          accessibilityLabel={detailAccessibilityLabel}
          accessibilityRole="button"
          onPress={onDetailPress}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>{detailLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityLabel={returnAccessibilityLabel}
        accessibilityRole="button"
        onPress={onReturnPress}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>{returnLabel}</Text>
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
