import { Pressable, StyleSheet, Text, View } from "react-native";
import type { QuickEntryMode } from "./firstVersionFlowCopy";

export type QuickEntryModeDisplayItem = {
  accessibilityLabel: string;
  copy: string;
  icon: string;
  key: QuickEntryMode;
  label: string;
};

type QuickEntryModeRailProps = {
  disabled: boolean;
  items: QuickEntryModeDisplayItem[];
  onModePress: (mode: QuickEntryMode) => void;
};

function quickEntryModeTarget(item: QuickEntryModeDisplayItem) {
  return item.key;
}

function quickEntryModeRenderKey(item: QuickEntryModeDisplayItem) {
  return `record-${item.key}`;
}

function quickEntryModeAccessibilityLabel(item: QuickEntryModeDisplayItem) {
  return item.accessibilityLabel;
}

function quickEntryModeIcon(item: QuickEntryModeDisplayItem) {
  return item.icon;
}

function quickEntryModeLabel(item: QuickEntryModeDisplayItem) {
  return item.label;
}

function quickEntryModeCopy(item: QuickEntryModeDisplayItem) {
  return item.copy;
}

export function QuickEntryModeRail({ disabled, items, onModePress }: QuickEntryModeRailProps) {
  return (
    <View style={styles.quickEntryRail}>
      {items.map((item) => (
        <Pressable
          key={quickEntryModeRenderKey(item)}
          accessibilityLabel={quickEntryModeAccessibilityLabel(item)}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          style={[styles.quickEntryItem, disabled ? styles.buttonDisabled : null]}
          disabled={disabled}
          onPress={() => onModePress(quickEntryModeTarget(item))}
        >
          <Text style={styles.quickEntryIcon}>{quickEntryModeIcon(item)}</Text>
          <Text style={styles.quickEntryLabel}>{quickEntryModeLabel(item)}</Text>
          <Text style={styles.quickEntryCopy}>{quickEntryModeCopy(item)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.55
  },
  quickEntryCopy: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16
  },
  quickEntryIcon: {
    color: "#3FA67F",
    fontSize: 18,
    fontWeight: "900"
  },
  quickEntryItem: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    flexGrow: 1,
    gap: 4,
    minHeight: 72,
    minWidth: "30%",
    padding: 12
  },
  quickEntryLabel: {
    color: "#0F3F37",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18
  },
  quickEntryRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
});
