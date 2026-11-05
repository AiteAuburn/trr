import { palette } from "./designTokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RecordItem } from "./recordBounds";
import type { TodayTimelineSummary } from "./todayTimelineTransforms";

type TodayTimelineItem = {
  key: string;
  record: RecordItem;
  icon: string;
  typeLabel: string;
  payloadSummary: string;
  timeLabel: string;
  accessibilityLabel: string;
};

type TodayTimelineProps = {
  dateLabel: string;
  summary: TodayTimelineSummary;
  items: TodayTimelineItem[];
  disabled: boolean;
  onSpeak: () => void;
  onItemPress: (record: RecordItem) => void;
  onOpenHistory: () => void;
};

export function TodayTimeline({
  dateLabel,
  summary,
  items,
  disabled,
  onSpeak,
  onItemPress,
  onOpenHistory
}: TodayTimelineProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text accessibilityRole="header" style={styles.title}>今天的紀錄</Text>
      </View>

      <View style={styles.statRow}>
        <View style={[styles.statTile, styles.statTileBrand]}>
          <Text style={styles.statLabelOnBrand}>最近血糖</Text>
          <Text style={styles.statValueOnBrand}>{summary.latestGlucoseValue}</Text>
          <Text style={styles.statMetaOnBrand}>{summary.latestGlucoseMeta}</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>今天記了</Text>
          <Text style={styles.statValue}>{summary.recordCountText}</Text>
          <Text style={styles.statMeta}>筆</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>運動</Text>
          <Text style={styles.statValue}>{summary.exerciseMinutesText}</Text>
          <Text style={styles.statMeta}>分鐘</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>今天還沒有紀錄</Text>
          <Text style={styles.emptyBody}>點下面的按鈕，說一句就能記下來。</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {items.map((item, index) => (
            <View key={item.key} style={styles.timelineRow}>
              <Text style={styles.timelineTime}>{item.timeLabel}</Text>
              <View style={styles.timelineRail}>
                <View style={styles.timelineDot} />
                {index < items.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <Pressable
                accessibilityLabel={item.accessibilityLabel}
                accessibilityRole="button"
                style={styles.timelineCard}
                onPress={() => onItemPress(item.record)}
              >
                <Text style={styles.timelineKind}>
                  {item.icon} {item.typeLabel}
                </Text>
                <Text style={styles.timelineValue}>{item.payloadSummary}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable
        accessibilityLabel="說話記一筆"
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        style={[styles.speakButton, disabled ? styles.speakButtonDisabled : null]}
        onPress={onSpeak}
      >
        <Text style={styles.speakButtonText}>說話記一筆</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="查看全部歷史紀錄"
        accessibilityRole="button"
        style={styles.historyLink}
        onPress={onOpenHistory}
      >
        <Text style={styles.historyLinkText}>看全部歷史</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: 18,
    paddingTop: 8
  },
  header: {
    gap: 4
  },
  date: {
    color: palette.secondary,
    fontSize: 14,
    fontWeight: "700"
  },
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36
  },
  statRow: {
    flexDirection: "row",
    gap: 10
  },
  statTile: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 14
  },
  statTileBrand: {
    backgroundColor: palette.brand,
    borderColor: palette.brand
  },
  statLabel: {
    color: palette.secondary,
    fontSize: 12,
    fontWeight: "700"
  },
  statValue: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32
  },
  statMeta: {
    color: palette.muted,
    fontSize: 12
  },
  statLabelOnBrand: {
    color: palette.onBrand,
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.85
  },
  statValueOnBrand: {
    color: palette.onBrand,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32
  },
  statMetaOnBrand: {
    color: palette.onBrand,
    fontSize: 12,
    opacity: 0.85
  },
  timeline: {
    gap: 0
  },
  timelineRow: {
    flexDirection: "row",
    gap: 10
  },
  timelineTime: {
    color: palette.secondary,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    paddingTop: 16,
    width: 44
  },
  timelineRail: {
    alignItems: "center",
    width: 12
  },
  timelineDot: {
    backgroundColor: palette.brand,
    borderRadius: 999,
    height: 10,
    marginTop: 19,
    width: 10
  },
  timelineLine: {
    backgroundColor: palette.accentBorder,
    flex: 1,
    width: 2
  },
  timelineCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    marginBottom: 10,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  timelineKind: {
    color: palette.secondary,
    fontSize: 12,
    fontWeight: "700"
  },
  timelineValue: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23
  },
  emptyCard: {
    backgroundColor: palette.wash,
    borderRadius: 18,
    gap: 4,
    padding: 18
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "800"
  },
  emptyBody: {
    color: palette.secondary,
    fontSize: 14,
    lineHeight: 21
  },
  speakButton: {
    alignItems: "center",
    backgroundColor: palette.brand,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24
  },
  speakButtonDisabled: {
    opacity: 0.5
  },
  speakButtonText: {
    color: palette.onBrand,
    fontSize: 17,
    fontWeight: "800"
  },
  historyLink: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center"
  },
  historyLinkText: {
    color: palette.brand,
    fontSize: 15,
    fontWeight: "700"
  }
});
