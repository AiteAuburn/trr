import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

export type SessionManagementPreviewListItem = {
  accessibilityLabel: string;
  copy: string;
  statusLabel: string;
  title: string;
};

type SessionManagementPreviewListProps<Item extends SessionManagementPreviewListItem> = {
  items: Item[];
  onSessionPress: (item: Item) => void;
};

export function SessionManagementPreviewList<Item extends SessionManagementPreviewListItem>({
  items,
  onSessionPress
}: SessionManagementPreviewListProps<Item>) {
  return (
    <View style={styles.aiReviewList}>
      {items.map((item) => (
        <Pressable
          accessibilityLabel={item.accessibilityLabel}
          accessibilityRole="button"
          key={item.title}
          onPress={() => onSessionPress(item)}
          style={styles.aiReviewCard}
        >
          <View style={styles.iconCircleSmall}>
            <Text>裝</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.recordContent}>{item.title}</Text>
            <Text style={styles.evidence}>{item.copy}</Text>
          </View>
          <Text style={styles.previewModeBadge}>{item.statusLabel}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  aiReviewCard: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.accentBorder,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    padding: 14
  },
  aiReviewList: {
    gap: 10
  },
  evidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  iconCircleSmall: {
    alignItems: "center",
    backgroundColor: palette.wash,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  previewModeBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.wash,
    borderColor: palette.accentBorder,
    borderRadius: 999,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  recordContent: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
