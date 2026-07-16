import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppScreen } from "./navigationConfig";

export type RecordResultDestinationItem = {
  accessibilityLabel: string;
  helper: string;
  icon: string;
  label: string;
  target: AppScreen;
};

type RecordResultDestinationGridProps = {
  items: RecordResultDestinationItem[];
  onDestinationPress: (target: AppScreen) => void;
};

function destinationCardTarget(item: RecordResultDestinationItem) {
  return item.target;
}

function destinationCardKey(item: RecordResultDestinationItem) {
  return `${item.target}-${item.label}`;
}

function destinationCardAccessibilityLabel(item: RecordResultDestinationItem) {
  return item.accessibilityLabel;
}

function destinationCardIcon(item: RecordResultDestinationItem) {
  return item.icon;
}

function destinationCardLabel(item: RecordResultDestinationItem) {
  return item.label;
}

function destinationCardHelper(item: RecordResultDestinationItem) {
  return item.helper;
}

export function RecordResultDestinationGrid({
  items,
  onDestinationPress
}: RecordResultDestinationGridProps) {
  return (
    <View style={styles.postSaveGrid}>
      {items.map((item) => (
        <Pressable
          key={destinationCardKey(item)}
          accessibilityLabel={destinationCardAccessibilityLabel(item)}
          accessibilityRole="button"
          style={styles.postSaveCard}
          onPress={() => onDestinationPress(destinationCardTarget(item))}
        >
          <View style={styles.historyItemTitle}>
            <View style={styles.iconCircleSmall}>
              <Text>{destinationCardIcon(item)}</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.recordType}>{destinationCardLabel(item)}</Text>
              <Text style={styles.evidence}>{destinationCardHelper(item)}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  historyItemTitle: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10
  },
  iconCircleSmall: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  postSaveCard: {
    backgroundColor: "#F7FCFA",
    borderColor: "#D6EEE4",
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    minHeight: 72,
    padding: 14
  },
  postSaveGrid: {
    gap: 10
  },
  recordType: {
    color: "#3FA67F",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
