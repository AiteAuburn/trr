import { Pressable, StyleSheet, Text, View } from "react-native";

export type FoodCommunityListDisplayItem = {
  accessibilityLabel: string;
  id: string;
  metricSummary: string;
  title: string;
};

type FoodCommunityItemListProps = {
  items: readonly FoodCommunityListDisplayItem[];
  onSelectItem: (item: FoodCommunityListDisplayItem) => void;
  selectedItem: FoodCommunityListDisplayItem | null;
};

function foodCommunityItemTarget(item: FoodCommunityListDisplayItem) {
  return item.id;
}

function foodCommunityListItemKey(item: FoodCommunityListDisplayItem) {
  return item.id;
}

function foodCommunityListItemAccessibilityLabel(item: FoodCommunityListDisplayItem) {
  return item.accessibilityLabel;
}

function foodCommunityListItemSelected(
  item: FoodCommunityListDisplayItem,
  selectedItem: FoodCommunityListDisplayItem | null
) {
  return selectedItem?.id === item.id;
}

function foodCommunityListIsEmpty(items: readonly FoodCommunityListDisplayItem[]) {
  return items.length === 0;
}

function foodCommunityListItemTitle(item: { title: string }) {
  return item.title;
}

function foodCommunityListItemMetricSummary(item: { metricSummary: string }) {
  return item.metricSummary;
}

function foodCommunityListEmptyTitle() {
  return "沒有符合的食物";
}

function foodCommunityListEmptyCopy() {
  return "可清除搜尋文字或切換分類；backend ready 時會依搜尋同步，未連線時只篩選本機預覽。";
}

function pressFoodCommunityItem(item: FoodCommunityListDisplayItem, onSelectItem: (item: FoodCommunityListDisplayItem) => void) {
  onSelectItem(item);
}

export function FoodCommunityItemList({ items, onSelectItem, selectedItem }: FoodCommunityItemListProps) {
  return (
    <View style={styles.openSection}>
      {items.map((item) => (
        <Pressable
          key={foodCommunityListItemKey(item)}
          accessibilityLabel={foodCommunityListItemAccessibilityLabel(item)}
          accessibilityRole="button"
          accessibilityState={{ selected: foodCommunityListItemSelected(item, selectedItem) }}
          style={[
            styles.recordCard,
            foodCommunityListItemSelected(item, selectedItem) ? styles.recordCardSelected : null
          ]}
          onPress={() => pressFoodCommunityItem(item, onSelectItem)}
        >
          <View style={styles.timelineContent}>
            <Text style={styles.recordContent}>{foodCommunityListItemTitle(item)}</Text>
            <Text style={styles.evidence}>{foodCommunityListItemMetricSummary(item)}</Text>
          </View>
          <Text style={styles.recordType}>›</Text>
        </Pressable>
      ))}
      {foodCommunityListIsEmpty(items) ? (
        <View style={styles.inlineInfoBlock}>
          <Text style={styles.label}>{foodCommunityListEmptyTitle()}</Text>
          <Text style={styles.evidence}>{foodCommunityListEmptyCopy()}</Text>
        </View>
      ) : null}
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
  inlineInfoBlock: {
    gap: 8,
    paddingVertical: 2
  },
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  openSection: {
    gap: 10
  },
  recordCard: {
    backgroundColor: "#ffffff",
    borderColor: "#E3E8E5",
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    minHeight: 72,
    padding: 14
  },
  recordCardSelected: {
    backgroundColor: "#F7FCFA",
    borderColor: "#3FA67F"
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
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
