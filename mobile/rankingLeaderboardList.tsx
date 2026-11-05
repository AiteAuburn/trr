import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import type { CommunityLeaderboardDisplaySection } from "./futureModuleDisplay";

type RankingLeaderboardListProps = {
  sections: readonly CommunityLeaderboardDisplaySection[];
};

function rankingLeaderboardSectionKey(section: CommunityLeaderboardDisplaySection) {
  return section.type;
}

function rankingLeaderboardSectionLabel(section: CommunityLeaderboardDisplaySection) {
  return section.label;
}

function rankingLeaderboardSectionHasEntries(section: CommunityLeaderboardDisplaySection) {
  return section.entries.length > 0;
}

function rankingLeaderboardSectionEntries(section: CommunityLeaderboardDisplaySection) {
  return section.entries;
}

function rankingLeaderboardEntryKey(entry: CommunityLeaderboardDisplaySection["entries"][number]) {
  return entry.id;
}

function rankingLeaderboardEntryRankLabel(entry: CommunityLeaderboardDisplaySection["entries"][number]) {
  return entry.rankLabel;
}

function rankingLeaderboardEntryDisplayName(entry: CommunityLeaderboardDisplaySection["entries"][number]) {
  return entry.displayName;
}

function rankingLeaderboardEntryScoreLabel(entry: CommunityLeaderboardDisplaySection["entries"][number]) {
  return entry.scoreLabel;
}

function rankingLeaderboardSectionEmptyCopy(section: CommunityLeaderboardDisplaySection) {
  return section.emptyCopy;
}

export function RankingLeaderboardList({ sections }: RankingLeaderboardListProps) {
  return (
    <>
      {sections.map((section) => (
        <View key={rankingLeaderboardSectionKey(section)} style={styles.inlineInfoBlock}>
          <Text style={styles.label}>{rankingLeaderboardSectionLabel(section)}</Text>
          {rankingLeaderboardSectionHasEntries(section) ? (
            rankingLeaderboardSectionEntries(section).map((entry) => (
              <View key={rankingLeaderboardEntryKey(entry)} style={styles.highlightRow}>
                <Text style={styles.recordType}>{rankingLeaderboardEntryRankLabel(entry)}</Text>
                <View style={styles.timelineContent}>
                  <Text style={styles.recordContent}>{rankingLeaderboardEntryDisplayName(entry)}</Text>
                  <Text style={styles.evidence}>{rankingLeaderboardEntryScoreLabel(entry)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.evidence}>{rankingLeaderboardSectionEmptyCopy(section)}</Text>
          )}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  evidence: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  highlightRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  inlineInfoBlock: {
    backgroundColor: palette.subtle,
    borderColor: palette.accentBorder,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 12,
    width: "100%"
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  recordContent: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  recordType: {
    color: palette.brand,
    fontSize: 15,
    fontWeight: "800"
  },
  timelineContent: {
    flex: 1,
    gap: 3
  }
});
