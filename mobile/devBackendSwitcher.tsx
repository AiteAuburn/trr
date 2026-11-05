import { palette } from "./designTokens";
import { StyleSheet, Text, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";

export type DevBackendTarget = "local" | "aws";

type DevBackendSwitcherProps = {
  disabled: boolean;
  selectedTarget: DevBackendTarget | null;
  onTargetPress: (target: DevBackendTarget) => void;
};

const targetLabels: Record<DevBackendTarget, string> = {
  local: "本機",
  aws: "AWS"
};

export function DevBackendSwitcher({
  disabled,
  selectedTarget,
  onTargetPress
}: DevBackendSwitcherProps) {
  function pressLocalTarget() {
    onTargetPress("local");
  }

  function pressAwsTarget() {
    onTargetPress("aws");
  }

  const currentTargetLabel = selectedTarget ? targetLabels[selectedTarget] : "自訂";
  const localSelected = selectedTarget === "local";
  const awsSelected = selectedTarget === "aws";
  const localDisabled = disabled || localSelected;
  const awsDisabled = disabled || awsSelected;

  return (
    <View accessibilityLabel={`開發伺服器，目前使用${currentTargetLabel}`} style={styles.shell}>
      <View style={styles.statusGroup}>
        <View style={[styles.statusDot, disabled ? styles.statusDotBusy : null]} />
        <View>
          <Text style={styles.eyebrow}>DEV SERVER</Text>
          <Text style={styles.statusText}>目前：{currentTargetLabel}</Text>
        </View>
      </View>

      <View style={styles.segment}>
        <Pressable
          accessibilityLabel="切換到本機開發伺服器"
          accessibilityRole="button"
          accessibilityState={{ disabled: localDisabled, selected: localSelected }}
          disabled={localDisabled}
          onPress={pressLocalTarget}
          style={[
            styles.segmentButton,
            localSelected ? styles.segmentButtonSelected : null,
            localDisabled && !localSelected ? styles.segmentButtonDisabled : null
          ]}
        >
          <Text style={[styles.segmentText, localSelected ? styles.segmentTextSelected : null]}>
            本機
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="切換到 AWS 測試伺服器"
          accessibilityRole="button"
          accessibilityState={{ disabled: awsDisabled, selected: awsSelected }}
          disabled={awsDisabled}
          onPress={pressAwsTarget}
          style={[
            styles.segmentButton,
            awsSelected ? styles.segmentButtonSelected : null,
            awsDisabled && !awsSelected ? styles.segmentButtonDisabled : null
          ]}
        >
          <Text style={[styles.segmentText, awsSelected ? styles.segmentTextSelected : null]}>
            AWS
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: palette.wash,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0,
    maxWidth: 520,
    paddingHorizontal: 14,
    paddingVertical: 6,
    width: "100%"
  },
  statusGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9
  },
  statusDot: {
    backgroundColor: palette.brand,
    borderColor: palette.accentBorder,
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    width: 10
  },
  statusDotBusy: {
    backgroundColor: "#F2C66D",
    borderColor: "#FFF0CA"
  },
  eyebrow: {
    color: palette.secondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2
  },
  statusText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 1
  },
  segment: {
    backgroundColor: palette.border,
    borderRadius: 12,
    flexDirection: "row",
    padding: 3
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 9,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 62,
    paddingHorizontal: 12
  },
  segmentButtonSelected: {
    backgroundColor: palette.surface
  },
  segmentButtonDisabled: {
    opacity: 0.48
  },
  segmentText: {
    color: palette.secondary,
    fontSize: 13,
    fontWeight: "700"
  },
  segmentTextSelected: {
    color: "#17604F"
  }
});
