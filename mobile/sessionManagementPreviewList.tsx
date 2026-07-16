import { Pressable, StyleSheet, Text, View } from "react-native";

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
    backgroundColor: "#FFFFFF",
    borderColor: "#D6EEE4",
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
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  iconCircleSmall: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  previewModeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF6F1",
    borderColor: "#D6EEE4",
    borderRadius: 999,
    borderWidth: 1,
    color: "#0F3F37",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  recordContent: {
    color: "#1E1E1E",
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
