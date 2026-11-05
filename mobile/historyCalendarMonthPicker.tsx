import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

export type HistoryCalendarDayItem = {
  accessibilityLabel: string;
  dayLabel: string;
  hasRecords: boolean;
  isSelected: boolean;
  key: string;
};

type HistoryCalendarMonthPickerProps<TDay extends HistoryCalendarDayItem> = {
  days: TDay[];
  firstWeekday: number;
  nextMonthAccessibilityLabel: string;
  nextMonthLabel: string;
  previousMonthAccessibilityLabel: string;
  previousMonthLabel: string;
  title: string;
  onDayPress: (item: TDay) => void;
  onNextMonthPress: () => void;
  onPreviousMonthPress: () => void;
};

export function HistoryCalendarMonthPicker<TDay extends HistoryCalendarDayItem>({
  days,
  firstWeekday,
  nextMonthAccessibilityLabel,
  nextMonthLabel,
  previousMonthAccessibilityLabel,
  previousMonthLabel,
  title,
  onDayPress,
  onNextMonthPress,
  onPreviousMonthPress
}: HistoryCalendarMonthPickerProps<TDay>) {
  return (
    <>
      <View style={styles.historyCalendarHeader}>
        <View>
          <Text style={styles.recordContent}>{title}</Text>
          <Text style={styles.confidence}>亮燈日期有紀錄</Text>
        </View>
        <View style={styles.historyMonthActionRow}>
          <Pressable
            accessibilityLabel={previousMonthAccessibilityLabel}
            accessibilityRole="button"
            style={styles.historyMonthButton}
            onPress={onPreviousMonthPress}
          >
            <Text style={styles.secondaryButtonText}>{previousMonthLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={nextMonthAccessibilityLabel}
            accessibilityRole="button"
            style={styles.historyMonthButton}
            onPress={onNextMonthPress}
          >
            <Text style={styles.secondaryButtonText}>{nextMonthLabel}</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.historyCalendarGrid}>
        {["一", "二", "三", "四", "五", "六", "日"].map((label) => (
          <Text key={label} style={styles.weekday}>{label}</Text>
        ))}
        {Array.from({ length: Math.min(6, Math.max(0, Math.trunc(firstWeekday) || 0)) }, (_, index) => (
          <View key={`empty-${index}`} style={styles.calendarSpacer} />
        ))}
        {days.map((item) => (
          <Pressable
            key={item.key}
            accessibilityLabel={item.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: item.isSelected }}
            style={[
              styles.historyCalendarDay,
              item.hasRecords ? styles.historyCalendarDayHasRecords : styles.historyCalendarDayMuted,
              item.isSelected ? styles.historyCalendarDaySelected : null
            ]}
            onPress={() => onDayPress(item)}
          >
            <Text
              style={[
                styles.historyCalendarDayText,
                item.hasRecords ? styles.historyCalendarDayTextActive : null,
                item.isSelected ? styles.historyCalendarDayTextSelected : null
              ]}
            >
              {item.dayLabel}
            </Text>
            {item.hasRecords ? <View style={styles.historyCalendarDot} /> : null}
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  confidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  historyCalendarDay: {
    alignItems: "center",
    borderRadius: 14,
    minHeight: 48,
    justifyContent: "center",
    position: "relative",
    width: "14.28%"
  },
  historyCalendarDayHasRecords: {
    backgroundColor: palette.wash,
    borderColor: palette.brand,
    borderWidth: 1
  },
  historyCalendarDayMuted: {
    backgroundColor: "transparent"
  },
  historyCalendarDaySelected: {
    backgroundColor: palette.ink,
    borderColor: palette.ink
  },
  historyCalendarDayText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: "800"
  },
  historyCalendarDayTextActive: {
    color: palette.ink
  },
  historyCalendarDayTextSelected: {
    color: palette.surface
  },
  historyCalendarDot: {
    backgroundColor: palette.brand,
    borderRadius: 999,
    bottom: 6,
    height: 5,
    position: "absolute",
    width: 5
  },
  historyCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 6
  },
  historyCalendarHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  historyMonthActionRow: {
    flexDirection: "row",
    flexShrink: 0,
    gap: 8
  },
  historyMonthButton: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.brand,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  recordContent: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  weekday: { color: palette.secondary, fontSize: 12, width: "14.28%", textAlign: "center", paddingVertical: 10 },
  calendarSpacer: { width: "14.28%", minHeight: 48 }
});
