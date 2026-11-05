import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";

export type FoodCommunityDetailShareListItem = {
  id: string;
  note: string;
  summary: string;
};

type FoodCommunityDetailShareListProps = {
  shares: readonly FoodCommunityDetailShareListItem[];
};

function foodCommunityDetailHasIndividualShares(shares: readonly FoodCommunityDetailShareListItem[]) {
  return shares.length > 0;
}

function foodCommunityDetailShareRowId(share: { id: string }) {
  return share.id;
}

function foodCommunityDetailShareRowSummary(share: { summary: string }) {
  return share.summary;
}

function foodCommunityDetailShareRowNote(share: { note: string }) {
  return share.note;
}

function foodCommunityDetailIndividualShareEmptyText() {
  return "尚未有可顯示的個別分享紀錄。";
}

export function FoodCommunityDetailShareList({ shares }: FoodCommunityDetailShareListProps) {
  return foodCommunityDetailHasIndividualShares(shares) ? (
    <>
      {shares.map((share) => (
        <View key={foodCommunityDetailShareRowId(share)} style={styles.visionResultCard}>
          <View style={styles.timelineContent}>
            <Text style={styles.recordContent}>{foodCommunityDetailShareRowSummary(share)}</Text>
            <Text style={styles.evidence}>{foodCommunityDetailShareRowNote(share)}</Text>
          </View>
        </View>
      ))}
    </>
  ) : (
    <View style={styles.inlineInfoBlock}>
      <Text style={styles.evidence}>{foodCommunityDetailIndividualShareEmptyText()}</Text>
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
  inlineInfoBlock: {
    gap: 8,
    paddingVertical: 2
  },
  recordContent: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  timelineContent: {
    flex: 1,
    gap: 3
  },
  visionResultCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 12
  }
});
