import { Pressable, StyleSheet, Text, View } from "react-native";

export type HistoryCalendarDayItem = {
  accessibilityLabel: string;
  dayLabel: string;
  hasRecords: boolean;
  isSelected: boolean;
  key: string;
};

type HistoryCalendarMonthPickerProps<TDay extends HistoryCalendarDayItem> = {
  days: TDay[];
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
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  historyCalendarDay: {
    alignItems: "center",
    borderRadius: 14,
    height: 46,
    justifyContent: "center",
    position: "relative",
    width: 46
  },
  historyCalendarDayHasRecords: {
    backgroundColor: "#EAF6F1",
    borderColor: "#3FA67F",
    borderWidth: 1
  },
  historyCalendarDayMuted: {
    backgroundColor: "#F1F4F2"
  },
  historyCalendarDaySelected: {
    backgroundColor: "#0F3F37",
    borderColor: "#0F3F37"
  },
  historyCalendarDayText: {
    color: "#8A9690",
    fontSize: 14,
    fontWeight: "800"
  },
  historyCalendarDayTextActive: {
    color: "#0F3F37"
  },
  historyCalendarDayTextSelected: {
    color: "#FFFFFF"
  },
  historyCalendarDot: {
    backgroundColor: "#3FA67F",
    borderRadius: 999,
    bottom: 6,
    height: 5,
    position: "absolute",
    width: 5
  },
  historyCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
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
    backgroundColor: "#FFFFFF",
    borderColor: "#3FA67F",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  secondaryButtonText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  }
});
