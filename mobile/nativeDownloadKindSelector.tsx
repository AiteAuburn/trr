import { Pressable, StyleSheet, Text, View } from "react-native";

type NativeDownloadKind = "whisper" | "llama";

type NativeDownloadKindSelectorProps = {
  disabled: boolean;
  llamaAccessibilityLabel: string;
  onLlamaPress: () => void;
  onWhisperPress: () => void;
  selectedKind: NativeDownloadKind;
  whisperAccessibilityLabel: string;
};

export function NativeDownloadKindSelector({
  disabled,
  llamaAccessibilityLabel,
  onLlamaPress,
  onWhisperPress,
  selectedKind,
  whisperAccessibilityLabel
}: NativeDownloadKindSelectorProps) {
  return (
    <View style={styles.actionRow}>
      <NativeDownloadKindChip
        accessibilityLabel={whisperAccessibilityLabel}
        disabled={disabled}
        label="Whisper"
        onPress={onWhisperPress}
        selected={selectedKind === "whisper"}
      />
      <NativeDownloadKindChip
        accessibilityLabel={llamaAccessibilityLabel}
        disabled={disabled}
        label="Llama"
        onPress={onLlamaPress}
        selected={selectedKind === "llama"}
      />
    </View>
  );
}

type NativeDownloadKindChipProps = {
  accessibilityLabel: string;
  disabled: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
};

function NativeDownloadKindChip({
  accessibilityLabel,
  disabled,
  label,
  onPress,
  selected
}: NativeDownloadKindChipProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      style={[
        styles.chip,
        selected ? styles.chipSelected : null,
        disabled ? styles.chipDisabled : null
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end"
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    marginRight: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipDisabled: {
    backgroundColor: "#F1F3F2",
    opacity: 0.55
  },
  chipSelected: {
    backgroundColor: "#3FA67F",
    borderColor: "#3FA67F"
  },
  chipText: {
    color: "#0F3F37",
    fontSize: 13,
    fontWeight: "800"
  },
  chipTextSelected: {
    color: "#ffffff"
  }
});
