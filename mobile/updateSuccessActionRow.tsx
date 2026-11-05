import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

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
