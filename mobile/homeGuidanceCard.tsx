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
      <View style={styles.homeGuidanceInfoRow}>
        <View style={styles.homeGuidanceInfoIcon}>
          <Text style={styles.homeGuidanceInfoIconText}>i</Text>
        </View>
        <Text style={styles.homeGuidanceCopy}>
          上面這排不是按鈕喔{"\n"}
          如果不知道從哪開始，可以參考這些記錄方向；想說什麼就說什麼，不用照固定格式。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  homeGuidanceCopy: {
    color: "#5F666A",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    maxWidth: 300,
    textAlign: "left"
  },
  homeGuidanceIcon: {
    fontSize: 17,
    lineHeight: 22
  },
  homeGuidanceInfoIcon: {
    alignItems: "center",
    backgroundColor: "#DCEFE7",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    marginTop: 1,
    width: 24
  },
  homeGuidanceInfoIconText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18
  },
  homeGuidanceInfoRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 9,
    maxWidth: 350,
    width: "100%"
  },
  homeGuidanceItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 28,
    minWidth: 88
  },
  homeGuidanceLabel: {
    color: "#2F5F52",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20
  },
  homeGuidancePanel: {
    backgroundColor: "#EFF8F4",
    borderColor: "#DCEFE7",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%"
  },
  homeGuidanceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center"
  },
  homeGuidanceSection: {
    alignItems: "center",
    gap: 8,
    maxWidth: 360,
    width: "100%"
  },
  homeTagline: {
    color: "#0F3F37",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 32,
    textAlign: "center"
  },
  homeTaglineCue: {
    color: "#3FA67F",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20
  },
  homeTaglineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  }
});
