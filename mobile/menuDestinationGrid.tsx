import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppScreen } from "./navigationConfig";

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
            <Text style={styles.menuIconText}>{menuDestinationIcon(item)}</Text>
          </View>
          <Text style={styles.menuLabel}>{menuDestinationLabel(item)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    justifyContent: "center",
    minHeight: 118,
    padding: 16,
    width: "47%"
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  menuIconCenter: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  menuIconText: {
    fontSize: 26
  },
  menuLabel: {
    color: "#0F3F37",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  }
});
