import { Pressable, StyleSheet, Text, View } from "react-native";
import { DailyRecordDetailRow } from "./dailyRecordDetailRow";
import { DailyRecordEntryActionRow } from "./dailyRecordEntryActionRow";

export type DailyRecordEntryDetailRowItem = {
  label: string;
  value: string;
};

export type DailyRecordEntryDisplayListItem = {
  accessibilityLabel: string;
  detailRows: DailyRecordEntryDetailRowItem[];
  editAccessibilityLabel: string;
  editLabel: string;
  index: number;
  key: string;
  manageLabel: string;
  payloadSummary: string;
  removeAccessibilityLabel: string;
  removeLabel: string;
  timeLabel: string;
  typeLabel: string;
};

export type DailyRecordSectionDisplayListItem = {
  countLabel: string;
  description: string;
  emptyCopy: string;
  entries: DailyRecordEntryDisplayListItem[];
  icon: string;
  id: string;
  title: string;
};

type DailyRecordSectionListProps = {
  menuIndex: number | null;
  onEditEntry: (index: number) => void;
  onManageEntry: (index: number, typeLabel: string) => void;
  onRemoveEntry: (index: number) => void;
  sections: readonly DailyRecordSectionDisplayListItem[];
};

function dailyRecordSectionKey(section: DailyRecordSectionDisplayListItem) {
  return section.id;
}

function dailyRecordSectionIcon(section: DailyRecordSectionDisplayListItem) {
  return section.icon;
}

function dailyRecordSectionTitle(section: DailyRecordSectionDisplayListItem) {
  return section.title;
}

function dailyRecordSectionDescription(section: DailyRecordSectionDisplayListItem) {
  return section.description;
}

function dailyRecordSectionCountLabel(section: DailyRecordSectionDisplayListItem) {
  return section.countLabel;
}

function dailyRecordSectionEntries(section: DailyRecordSectionDisplayListItem) {
  return section.entries;
}

function dailyRecordSectionHasEntries(section: DailyRecordSectionDisplayListItem) {
  return dailyRecordSectionEntries(section).length > 0;
}

function dailyRecordSectionEmptyCopy(section: DailyRecordSectionDisplayListItem) {
  return section.emptyCopy;
}

function dailyRecordEntryTarget(item: DailyRecordEntryDisplayListItem) {
  return item.index;
}

function dailyRecordEntryTypeLabel(item: DailyRecordEntryDisplayListItem) {
  return item.typeLabel;
}

function dailyRecordEntryKey(item: DailyRecordEntryDisplayListItem) {
  return item.key;
}

function dailyRecordEntryTimeLabel(item: DailyRecordEntryDisplayListItem) {
  return item.timeLabel;
}

function dailyRecordEntryPayloadSummary(item: DailyRecordEntryDisplayListItem) {
  return item.payloadSummary;
}

function dailyRecordEntryAccessibilityLabel(item: DailyRecordEntryDisplayListItem) {
  return item.accessibilityLabel;
}

function dailyRecordEntryManageLabel(item: DailyRecordEntryDisplayListItem) {
  return item.manageLabel;
}

function dailyRecordEntryEditAccessibilityLabel(item: DailyRecordEntryDisplayListItem) {
  return item.editAccessibilityLabel;
}

function dailyRecordEntryEditLabel(item: DailyRecordEntryDisplayListItem) {
  return item.editLabel;
}

function dailyRecordEntryRemoveAccessibilityLabel(item: DailyRecordEntryDisplayListItem) {
  return item.removeAccessibilityLabel;
}

function dailyRecordEntryRemoveLabel(item: DailyRecordEntryDisplayListItem) {
  return item.removeLabel;
}

function dailyRecordEntryDetailRows(item: DailyRecordEntryDisplayListItem) {
  return item.detailRows;
}

function dailyRecordDetailRowKey(item: DailyRecordEntryDisplayListItem, row: DailyRecordEntryDetailRowItem) {
  return `${item.key}-${row.label}`;
}

function dailyRecordDetailRowLabel(row: DailyRecordEntryDetailRowItem) {
  return row.label;
}

function dailyRecordDetailRowValue(row: DailyRecordEntryDetailRowItem) {
  return row.value;
}

function isDailyRecordEntryMenuOpen(item: DailyRecordEntryDisplayListItem, menuIndex: number | null) {
  return menuIndex === dailyRecordEntryTarget(item);
}

function pressDailyRecordEntryMenu(
  item: DailyRecordEntryDisplayListItem,
  onManageEntry: (index: number, typeLabel: string) => void
) {
  onManageEntry(dailyRecordEntryTarget(item), dailyRecordEntryTypeLabel(item));
}

function pressDailyRecordEntryEdit(item: DailyRecordEntryDisplayListItem, onEditEntry: (index: number) => void) {
  onEditEntry(dailyRecordEntryTarget(item));
}

function pressDailyRecordEntryDelete(item: DailyRecordEntryDisplayListItem, onRemoveEntry: (index: number) => void) {
  onRemoveEntry(dailyRecordEntryTarget(item));
}

export function DailyRecordSectionList({
  menuIndex,
  onEditEntry,
  onManageEntry,
  onRemoveEntry,
  sections
}: DailyRecordSectionListProps) {
  return (
    <View style={styles.dailyRecordSectionList}>
      {sections.map((section) => (
        <View key={dailyRecordSectionKey(section)} style={styles.dailyRecordSectionCard}>
          <View style={styles.recordHeader}>
            <View style={styles.historyItemTitle}>
              <View style={styles.iconCircleSmall}>
                <Text>{dailyRecordSectionIcon(section)}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.label}>{dailyRecordSectionTitle(section)}</Text>
                <Text style={styles.evidence}>{dailyRecordSectionDescription(section)}</Text>
              </View>
            </View>
            <Text style={styles.countText}>{dailyRecordSectionCountLabel(section)}</Text>
          </View>
          {dailyRecordSectionHasEntries(section) ? (
            dailyRecordSectionEntries(section).map((item) => (
              <View key={dailyRecordEntryKey(item)} style={styles.dailyRecordEntryCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.timelineContent}>
                    <Text style={styles.confidence}>{dailyRecordEntryTimeLabel(item)}</Text>
                    <Text style={styles.recordContent}>{dailyRecordEntryPayloadSummary(item)}</Text>
                  </View>
                  <Pressable
                    accessibilityLabel={dailyRecordEntryAccessibilityLabel(item)}
                    accessibilityRole="button"
                    style={styles.roundActionButton}
                    onPress={() => pressDailyRecordEntryMenu(item, onManageEntry)}
                  >
                    <Text style={styles.editGlyph}>{dailyRecordEntryManageLabel(item)}</Text>
                  </Pressable>
                </View>
                <View style={styles.detailRows}>
                  {dailyRecordEntryDetailRows(item).map((row) => (
                    <DailyRecordDetailRow
                      key={dailyRecordDetailRowKey(item, row)}
                      label={dailyRecordDetailRowLabel(row)}
                      value={dailyRecordDetailRowValue(row)}
                    />
                  ))}
                </View>
                {isDailyRecordEntryMenuOpen(item, menuIndex) ? (
                  <DailyRecordEntryActionRow
                    editAccessibilityLabel={dailyRecordEntryEditAccessibilityLabel(item)}
                    editLabel={dailyRecordEntryEditLabel(item)}
                    onEditPress={() => pressDailyRecordEntryEdit(item, onEditEntry)}
                    onRemovePress={() => pressDailyRecordEntryDelete(item, onRemoveEntry)}
                    removeAccessibilityLabel={dailyRecordEntryRemoveAccessibilityLabel(item)}
                    removeLabel={dailyRecordEntryRemoveLabel(item)}
                  />
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.evidence}>{dailyRecordSectionEmptyCopy(section)}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  confidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  countText: {
    color: "#3FA67F",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "900"
  },
  dailyRecordEntryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  dailyRecordSectionCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D6EEE4",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  dailyRecordSectionList: {
    gap: 12
  },
  detailRows: {
    gap: 8,
    paddingVertical: 2
  },
  editGlyph: {
    color: "#3FA67F",
    fontSize: 18,
    fontWeight: "900"
  },
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
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "900"
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  recordHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  roundActionButton: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
