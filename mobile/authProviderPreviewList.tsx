import { Pressable, StyleSheet, Text, View } from "react-native";

export type AuthProviderPreviewListItem = {
  accessibilityLabel: string;
  copy: string;
  icon: string;
  statusLabel: string;
  title: string;
};

type AuthProviderPreviewListProps<Item extends AuthProviderPreviewListItem> = {
  disabled: boolean;
  items: Item[];
  onProviderPress: (item: Item) => void;
};

function authProviderPreviewTitleLabel(item: { title: string }) {
  return `${item.title} 登入`;
}

export function AuthProviderPreviewList<Item extends AuthProviderPreviewListItem>({
  disabled,
  items,
  onProviderPress
}: AuthProviderPreviewListProps<Item>) {
  return (
    <View style={styles.aiReviewList}>
      {items.map((item) => (
        <Pressable
          accessibilityLabel={item.accessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          key={item.title}
          onPress={() => onProviderPress(item)}
          style={[styles.aiReviewCard, disabled ? styles.buttonDisabled : null]}
        >
          <View style={styles.iconCircleSmall}>
            <Text>{item.icon}</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.recordContent}>{authProviderPreviewTitleLabel(item)}</Text>
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
  buttonDisabled: {
    opacity: 0.45
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
