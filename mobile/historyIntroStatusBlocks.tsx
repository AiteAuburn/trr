import { StyleSheet, Text, View } from "react-native";

import { HighlightBulletRow } from "./highlightBulletRow";

type HistoryIntroStatusBlocksProps = {
  boundaryItems: string[];
  boundaryTitle: string;
  syncBody: string;
  syncTitle: string;
};

export function HistoryIntroStatusBlocks({
  boundaryItems,
  boundaryTitle,
  syncBody,
  syncTitle
}: HistoryIntroStatusBlocksProps) {
  return (
    <>
      <View style={styles.inlineInfoBlock}>
        <Text style={styles.label}>{syncTitle}</Text>
        <Text style={styles.evidence}>{syncBody}</Text>
      </View>
      <View style={styles.inlineInfoBlock}>
        <Text style={styles.label}>{boundaryTitle}</Text>
        {boundaryItems.map((item) => (
          <HighlightBulletRow key={item} text={item} />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  evidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19
  },
  inlineInfoBlock: {
    gap: 8,
    paddingVertical: 2
  },
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  }
});
