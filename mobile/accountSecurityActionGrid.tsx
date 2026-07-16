import { Pressable, StyleSheet, Text, View } from "react-native";

type AccountSecurityActionGridProps = {
  disabled: boolean;
  loadSessionsAccessibilityLabel: string;
  loadSessionsLabel: string;
  logoutAllAccessibilityLabel: string;
  logoutAllLabel: string;
  logoutLocalAccessibilityLabel: string;
  logoutLocalLabel: string;
  onLoadSessionsPress: () => void;
  onLogoutAllPress: () => void;
  onLogoutLocalPress: () => void;
  onRefreshSessionPress: () => void;
  refreshSessionAccessibilityLabel: string;
  refreshSessionLabel: string;
};

export function AccountSecurityActionGrid({
  disabled,
  loadSessionsAccessibilityLabel,
  loadSessionsLabel,
  logoutAllAccessibilityLabel,
  logoutAllLabel,
  logoutLocalAccessibilityLabel,
  logoutLocalLabel,
  onLoadSessionsPress,
  onLogoutAllPress,
  onLogoutLocalPress,
  onRefreshSessionPress,
  refreshSessionAccessibilityLabel,
  refreshSessionLabel
}: AccountSecurityActionGridProps) {
  return (
    <View style={styles.actionGrid}>
      <AccountSecurityActionButton
        accessibilityLabel={refreshSessionAccessibilityLabel}
        disabled={disabled}
        label={refreshSessionLabel}
        onPress={onRefreshSessionPress}
        variant="secondary"
      />
      <AccountSecurityActionButton
        accessibilityLabel={loadSessionsAccessibilityLabel}
        disabled={disabled}
        label={loadSessionsLabel}
        onPress={onLoadSessionsPress}
        variant="secondary"
      />
      <AccountSecurityActionButton
        accessibilityLabel={logoutLocalAccessibilityLabel}
        disabled={disabled}
        label={logoutLocalLabel}
        onPress={onLogoutLocalPress}
        variant="secondary"
      />
      <AccountSecurityActionButton
        accessibilityLabel={logoutAllAccessibilityLabel}
        disabled={disabled}
        label={logoutAllLabel}
        onPress={onLogoutAllPress}
        variant="danger"
      />
    </View>
  );
}

type AccountSecurityActionButtonProps = {
  accessibilityLabel: string;
  disabled: boolean;
  label: string;
  onPress: () => void;
  variant: "secondary" | "danger";
};

function AccountSecurityActionButton({
  accessibilityLabel,
  disabled,
  label,
  onPress,
  variant
}: AccountSecurityActionButtonProps) {
  const buttonStyle = variant === "danger" ? styles.dangerButton : styles.secondaryButton;
  const textStyle = variant === "danger" ? styles.dangerButtonText : styles.secondaryButtonText;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[buttonStyle, disabled ? styles.buttonDisabled : null]}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  buttonDisabled: {
    opacity: 0.45
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#FCEEEE",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  dangerButtonText: {
    color: "#C85D5D",
    fontSize: 14,
    fontWeight: "900"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#EAF6F1",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  secondaryButtonText: {
    color: "#0F3F37",
    fontSize: 14,
    fontWeight: "800"
  }
});
