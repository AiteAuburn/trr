import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";
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
  recordContent: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  settingsChevron: {
    color: palette.brand,
    fontSize: 28,
    fontWeight: "600"
  },
  settingsList: {
    gap: 10
  },
  settingsRow: {
    alignItems: "flex-start",
    backgroundColor: palette.surface,
    borderColor: palette.border,
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
