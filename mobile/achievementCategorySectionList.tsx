import { StyleSheet, Text, View } from "react-native";
import { achievementStreakBadgeColor, type AchievementDisplayItem } from "./futureModuleDisplay";

export type AchievementCategoryDisplaySectionListItem = {
  items: AchievementDisplayItem[];
  key: string;
  label: string;
};

type AchievementCategorySectionListProps = {
  sections: readonly AchievementCategoryDisplaySectionListItem[];
};

function achievementCategorySectionKey(section: AchievementCategoryDisplaySectionListItem) {
  return section.key;
}

function achievementCategorySectionLabel(section: AchievementCategoryDisplaySectionListItem) {
  return section.label;
}

function achievementCategorySectionItems(section: AchievementCategoryDisplaySectionListItem) {
  return section.items;
}

function achievementProgressCardKey(displayItem: AchievementDisplayItem) {
  return displayItem.id;
}

function achievementProgressCardAccessibilityLabel(displayItem: AchievementDisplayItem) {
  return displayItem.accessibilityLabel;
}

function achievementProgressCardIsUnlocked(displayItem: AchievementDisplayItem) {
  return displayItem.progress >= displayItem.target;
}

function achievementProgressCardRatio(displayItem: AchievementDisplayItem) {
  return Math.min(1, displayItem.progress / displayItem.target);
}

function achievementProgressCardStyle(displayItem: AchievementDisplayItem) {
  return [styles.achievementCard, achievementProgressCardIsUnlocked(displayItem) ? styles.achievementUnlocked : null];
}

function achievementProgressCardStatusStyle(displayItem: AchievementDisplayItem) {
  return achievementProgressCardIsUnlocked(displayItem) ? styles.recordType : styles.confidence;
}

function achievementProgressCardStatusText(displayItem: AchievementDisplayItem) {
  return achievementProgressCardIsUnlocked(displayItem) ? "完成" : displayItem.progressLabel;
}

function achievementProgressCardDetail(displayItem: AchievementDisplayItem) {
  return `${displayItem.kindLabel} · ${displayItem.description}`;
}

function achievementProgressCardFillStyle(displayItem: AchievementDisplayItem) {
  return [
    styles.achievementProgressFill,
    displayItem.kind === "streak" ? styles.achievementProgressFillStreak : null,
    { width: `${Math.round(achievementProgressCardRatio(displayItem) * 100)}%` as const }
  ];
}

function achievementProgressCardBadgeStyle(displayItem: AchievementDisplayItem) {
  return [
    styles.achievementBadge,
    displayItem.kind === "streak" ? styles.achievementBadgeStreak : null,
    { backgroundColor: displayItem.badgeColor }
  ];
}

function achievementProgressCardIcon(displayItem: AchievementDisplayItem) {
  return displayItem.icon;
}

function achievementProgressCardLevel(displayItem: AchievementDisplayItem) {
  return displayItem.level;
}

function achievementProgressCardTitle(displayItem: AchievementDisplayItem) {
  return displayItem.title;
}

export function AchievementCategorySectionList({ sections }: AchievementCategorySectionListProps) {
  return (
    <>
      {sections.map((section) => (
        <View key={achievementCategorySectionKey(section)} style={styles.openSection}>
          <Text style={styles.label}>{achievementCategorySectionLabel(section)}</Text>
          {achievementCategorySectionItems(section).map((displayItem) => {
            return (
              <View
                key={achievementProgressCardKey(displayItem)}
                accessibilityLabel={achievementProgressCardAccessibilityLabel(displayItem)}
                style={achievementProgressCardStyle(displayItem)}
              >
                <View style={achievementProgressCardBadgeStyle(displayItem)}>
                  <Text style={styles.achievementBadgeIcon}>{achievementProgressCardIcon(displayItem)}</Text>
                  <Text style={styles.achievementBadgeLevel}>{achievementProgressCardLevel(displayItem)}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.recordContent}>{achievementProgressCardTitle(displayItem)}</Text>
                    <Text style={achievementProgressCardStatusStyle(displayItem)}>
                      {achievementProgressCardStatusText(displayItem)}
                    </Text>
                  </View>
                  <Text style={styles.evidence}>{achievementProgressCardDetail(displayItem)}</Text>
                  <View style={styles.achievementProgressTrack}>
                    <View style={achievementProgressCardFillStyle(displayItem)} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </>
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
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18
  },
  achievementBadgeLevel: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 20
  },
  achievementBadgeStreak: {
    borderRadius: 999,
    transform: [{ rotate: "-3deg" }]
  },
  achievementCard: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    padding: 16
  },
  achievementProgressFill: {
    backgroundColor: "#3FA67F",
    borderRadius: 999,
    height: 8
  },
  achievementProgressFillStreak: {
    backgroundColor: achievementStreakBadgeColor
  },
  achievementProgressTrack: {
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 8,
    marginTop: 8,
    overflow: "hidden"
  },
  achievementUnlocked: {
    backgroundColor: "#F7FCFA",
    borderColor: "#9EDBC4"
  },
  confidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "900"
  },
  openSection: {
    gap: 10
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
    fontSize: 15,
    fontWeight: "800"
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
