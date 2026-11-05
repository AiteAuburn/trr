import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";
import type { AppScreen } from "./navigationConfig";
import { NavigationGlyph } from "./navigationGlyph";

export type MenuDestinationItem = {
  accessibilityLabel: string;
  icon: string;
  label: string;
  target: AppScreen;
};

type MenuDestinationGridProps = {
  items: MenuDestinationItem[];
  onDestinationPress: (target: AppScreen) => void;
};

function menuDestinationTarget(item: MenuDestinationItem) {
  return item.target;
}

function menuDestinationKey(item: MenuDestinationItem) {
  return item.target;
}

function menuDestinationAccessibilityLabel(item: MenuDestinationItem) {
  return item.accessibilityLabel;
}

function menuDestinationIcon(item: MenuDestinationItem) {
  return item.icon;
}

function menuDestinationLabel(item: MenuDestinationItem) {
  return item.label;
}

function menuDestinationHint(item: MenuDestinationItem) {
  switch (item.target) {
    case "today": return "用一句話，記下今天";
    case "history": return "每一天的紀錄，都在這裡";
    case "analysis": return "看見數字背後的變化";
    default: return "調整成適合自己的方式";
  }
}

export function MenuDestinationGrid({ items, onDestinationPress }: MenuDestinationGridProps) {
  return (
    <View style={styles.menuGrid}>
      {items.map((item) => (
        <Pressable
          key={menuDestinationKey(item)}
          accessibilityLabel={menuDestinationAccessibilityLabel(item)}
          accessibilityRole="button"
          style={styles.menuCard}
          onPress={() => onDestinationPress(menuDestinationTarget(item))}
        >
          <View style={styles.menuIconCenter}>
            <NavigationGlyph>{menuDestinationIcon(item)}</NavigationGlyph>
          </View>
          <View style={styles.menuCopy}>
          <Text style={styles.menuLabel}>{menuDestinationLabel(item)}</Text>
          <Text style={styles.menuHint}>{menuDestinationHint(item)}</Text>
          </View>
          <Text accessible={false} style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 96,
    padding: 18,
    width: "100%"
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  menuIconCenter: {
    alignItems: "center",
    backgroundColor: palette.wash,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  menuIconText: {
    fontSize: 26
  },
  menuLabel: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "left"
  },
  menuCopy: { flex: 1, gap: 5 },
  menuHint: { color: palette.secondary, fontSize: 12, lineHeight: 18 },
  chevron: { color: palette.secondary, fontSize: 26 }
});
