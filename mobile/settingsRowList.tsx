import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppScreen } from "./navigationConfig";

export type SettingsDisplayRow = {
  accessibilityLabel: string;
  helper?: string;
  icon: string;
  id: string;
  label: string;
  target?: AppScreen;
};

type SettingsRowListProps = {
  onRowPress: (row: SettingsDisplayRow) => void;
  quotaHelperText: string;
  rows: SettingsDisplayRow[];
};

function settingsDisplayRowKey(row: SettingsDisplayRow) {
  return row.id;
}

function settingsDisplayRowAccessibilityLabel(row: SettingsDisplayRow) {
  return row.accessibilityLabel;
}

function settingsDisplayRowIcon(row: SettingsDisplayRow) {
  return row.icon;
}

function settingsDisplayRowLabel(row: SettingsDisplayRow) {
  return row.label;
}

function settingsDisplayRowHelperText(row: SettingsDisplayRow, quotaHelperText: string) {
  return row.id === "quota" ? quotaHelperText : row.helper;
}

export function SettingsRowList({ onRowPress, quotaHelperText, rows }: SettingsRowListProps) {
  return (
    <View style={styles.settingsList}>
      {rows.map((row) => (
        <Pressable
          key={settingsDisplayRowKey(row)}
          accessibilityLabel={settingsDisplayRowAccessibilityLabel(row)}
          accessibilityRole="button"
          style={styles.settingsRow}
          onPress={() => onRowPress(row)}
        >
          <View style={styles.iconCircleSmall}>
            <Text>{settingsDisplayRowIcon(row)}</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.recordContent}>{settingsDisplayRowLabel(row)}</Text>
            <Text style={styles.evidence}>{settingsDisplayRowHelperText(row, quotaHelperText)}</Text>
          </View>
          <Text style={styles.settingsChevron}>›</Text>
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
  iconCircleSmall: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  settingsChevron: {
    color: "#3FA67F",
    fontSize: 28,
    fontWeight: "600"
  },
  settingsList: {
    gap: 10
  },
  settingsRow: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    minHeight: 64,
    padding: 14
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
