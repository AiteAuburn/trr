import { Pressable, StyleSheet, Text, View } from "react-native";
import type { FutureModuleCard } from "./futureModuleDisplay";
import { HighlightBulletRow } from "./highlightBulletRow";
import type { AppScreen } from "./navigationConfig";

export type FutureModuleDisplayCard = {
  accessibilityLabel: string;
  description: string;
  icon: string;
  key: string;
  module: FutureModuleCard;
  readiness: string;
  requirements: Array<{ key: string; text: string }>;
  safety: string;
  target?: AppScreen;
  title: string;
};

type FutureModuleCardListLabels = {
  readiness: string;
  viewIntegration: string;
  viewPreview: string;
};

type FutureModuleCardListProps = {
  cards: FutureModuleDisplayCard[];
  labels: FutureModuleCardListLabels;
  onDestinationPress: (target: AppScreen | undefined, module: FutureModuleCard) => void;
};

function futureModuleDestinationTarget(item: FutureModuleDisplayCard) {
  return item.target;
}

function futureModuleDestinationModule(item: FutureModuleDisplayCard) {
  return item.module;
}

function futureModuleCardKey(item: FutureModuleDisplayCard) {
  return item.key;
}

function futureModuleCardAccessibilityLabel(item: FutureModuleDisplayCard) {
  return item.accessibilityLabel;
}

function futureModuleCardIcon(item: FutureModuleDisplayCard) {
  return item.icon;
}

function futureModuleCardTitle(item: FutureModuleDisplayCard) {
  return item.title;
}

function futureModuleCardDescription(item: FutureModuleDisplayCard) {
  return item.description;
}

function futureModuleCardReadiness(item: FutureModuleDisplayCard) {
  return item.readiness;
}

function futureModuleCardRequirements(item: FutureModuleDisplayCard) {
  return item.requirements;
}

function futureModuleRequirementKey(requirement: FutureModuleDisplayCard["requirements"][number]) {
  return requirement.key;
}

function futureModuleRequirementText(requirement: FutureModuleDisplayCard["requirements"][number]) {
  return requirement.text;
}

function futureModuleCardSafety(item: FutureModuleDisplayCard) {
  return item.safety;
}

function futureModuleCardHasTarget(item: FutureModuleDisplayCard) {
  return Boolean(item.target);
}

export function FutureModuleCardList({ cards, labels, onDestinationPress }: FutureModuleCardListProps) {
  return (
    <>
      {cards.map((item) => (
        <Pressable
          key={futureModuleCardKey(item)}
          accessibilityLabel={futureModuleCardAccessibilityLabel(item)}
          accessibilityRole="button"
          style={styles.recordCard}
          onPress={() => onDestinationPress(futureModuleDestinationTarget(item), futureModuleDestinationModule(item))}
        >
          <View style={styles.recordHeader}>
            <View style={styles.iconCircleSmall}>
              <Text>{futureModuleCardIcon(item)}</Text>
            </View>
            <Text style={styles.recordType}>{futureModuleCardTitle(item)}</Text>
          </View>
          <Text style={styles.recordContent}>{futureModuleCardDescription(item)}</Text>
          <Text style={styles.evidence}>{futureModuleCardReadiness(item)}</Text>
          <View style={styles.inlineInfoBlock}>
            <Text style={styles.label}>{labels.readiness}</Text>
            {futureModuleCardRequirements(item).map((requirement) => (
              <HighlightBulletRow key={futureModuleRequirementKey(requirement)} text={futureModuleRequirementText(requirement)} />
            ))}
            <Text style={styles.warningText}>{futureModuleCardSafety(item)}</Text>
          </View>
          {futureModuleCardHasTarget(item) ? <Text style={styles.secondaryButtonText}>{labels.viewPreview}</Text> : null}
          {!futureModuleCardHasTarget(item) ? <Text style={styles.secondaryButtonText}>{labels.viewIntegration}</Text> : null}
        </Pressable>
      ))}
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
  iconCircleSmall: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  inlineInfoBlock: {
    gap: 8,
    paddingVertical: 2
  },
  label: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  recordCard: {
    backgroundColor: "#ffffff",
    borderColor: "#E3E8E5",
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    minHeight: 72,
    padding: 14
  },
  recordContent: {
    color: "#1E1E1E",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  recordHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  recordType: {
    color: "#3FA67F",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  secondaryButtonText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  },
  warningText: {
    color: "#C85D5D",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  }
});
