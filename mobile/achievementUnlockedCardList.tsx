import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { achievementUnlockDisplayDate, type AchievementDisplayItem } from "./futureModuleDisplay";

type AchievementUnlockedCardListProps = {
  badgeLabel: string;
  items: readonly AchievementDisplayItem[];
  keyPrefix: string;
  title: string;
};

function achievementUnlockedCardKey(prefix: string, displayItem: AchievementDisplayItem) {
  return `${prefix}-${displayItem.id}`;
}

function achievementUnlockedCardBadgeStyle(displayItem: AchievementDisplayItem) {
  return [
    styles.achievementBadge,
    displayItem.kind === "streak" ? styles.achievementBadgeStreak : null,
    { backgroundColor: displayItem.badgeColor }
  ];
}

function achievementUnlockedCardIcon(displayItem: AchievementDisplayItem) {
  return displayItem.icon;
}

function achievementUnlockedCardLevel(displayItem: AchievementDisplayItem) {
  return displayItem.level;
}

function achievementUnlockedCardTitle(displayItem: AchievementDisplayItem) {
  return displayItem.title;
}

function achievementUnlockedCardDetail(displayItem: AchievementDisplayItem) {
  return `${displayItem.kindLabel} · ${achievementUnlockDisplayDate(displayItem.unlockedAt)}`;
}

export function AchievementUnlockedCardList({
  badgeLabel,
  items,
  keyPrefix,
  title
}: AchievementUnlockedCardListProps) {
  return (
    <View style={styles.openSection}>
      <Text style={styles.label}>{title}</Text>
      {items.map((displayItem) => (
        <View key={achievementUnlockedCardKey(keyPrefix, displayItem)} style={styles.timelineCard}>
          <View style={achievementUnlockedCardBadgeStyle(displayItem)}>
            <Text style={styles.achievementBadgeIcon}>{achievementUnlockedCardIcon(displayItem)}</Text>
            <Text style={styles.achievementBadgeLevel}>{achievementUnlockedCardLevel(displayItem)}</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.recordContent}>{achievementUnlockedCardTitle(displayItem)}</Text>
            <Text style={styles.evidence}>{achievementUnlockedCardDetail(displayItem)}</Text>
          </View>
          <Text style={styles.previewModeBadge}>{badgeLabel}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  achievementBadge: {
    alignItems: "center",
    borderRadius: 10,
    height: 58,
    justifyContent: "center",
    minWidth: 58,
    paddingHorizontal: 8
  },
  achievementBadgeIcon: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18
  },
  achievementBadgeLevel: {
    color: palette.surface,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 20
  },
  achievementBadgeStreak: {
    borderRadius: 999,
    transform: [{ rotate: "-3deg" }]
  },
  evidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  openSection: {
    gap: 10
  },
  previewModeBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.wash,
    borderRadius: 999,
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  recordContent: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  timelineCard: {
    alignItems: "flex-start",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    padding: 16
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
