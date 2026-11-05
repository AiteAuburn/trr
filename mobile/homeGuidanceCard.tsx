import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { homeGuidanceDirections } from "./recordingCopy";

function homeGuidanceRowKey(rowIndex: number) {
  return `home-guidance-row-${rowIndex}`;
}

function homeGuidanceItemKey(item: (typeof homeGuidanceDirections)[number][number]) {
  return item.key;
}

function homeGuidanceItemIcon(item: (typeof homeGuidanceDirections)[number][number]) {
  return item.icon;
}

function homeGuidanceItemLabel(item: (typeof homeGuidanceDirections)[number][number]) {
  return item.label;
}

export function HomeGuidanceCard() {
  return (
    <View style={styles.homeGuidanceSection}>
      <View style={styles.homeTaglineRow}>
        <Text style={styles.homeTaglineCue}>✦</Text>
        <Text style={styles.homeTagline}>想說什麼就說什麼</Text>
        <Text style={styles.homeTaglineCue}>✦</Text>
      </View>
      <Text style={styles.homeInvitation}>從今天的一件小事開始，說給我聽。</Text>
      <View style={styles.homeGuidancePanel}>
        {homeGuidanceDirections.map((row, rowIndex) => (
          <View key={homeGuidanceRowKey(rowIndex)} style={styles.homeGuidanceRow}>
            {row.map((item) => (
              <View key={homeGuidanceItemKey(item)} style={styles.homeGuidanceItem}>
                <Text style={styles.homeGuidanceIcon}>{homeGuidanceItemIcon(item)}</Text>
                <Text style={styles.homeGuidanceLabel}>{homeGuidanceItemLabel(item)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  homeGuidanceIcon: {
    fontSize: 14,
    lineHeight: 22
  },
  homeGuidanceItem: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 28,
    minWidth: 0
  },
  homeGuidanceLabel: {
    color: palette.secondary,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20
  },
  homeGuidancePanel: {
    backgroundColor: palette.wash,
    borderRadius: 20,
    gap: 4,
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    width: "100%"
  },
  homeGuidanceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center"
  },
  homeGuidanceSection: {
    alignItems: "center",
    gap: 8,
    maxWidth: 360,
    width: "100%"
  },
  homeTagline: {
    color: palette.ink,
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 32,
    textAlign: "center"
  },
  homeTaglineCue: {
    color: palette.brand,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  homeTaglineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  homeInvitation: {
    color: palette.secondary,
    fontSize: 14,
    lineHeight: 23,
    textAlign: "center"
  }
});
