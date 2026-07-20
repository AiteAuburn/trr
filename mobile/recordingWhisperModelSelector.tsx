import { Pressable, StyleSheet, Text, View } from "react-native";

export type RecordingWhisperModelChoiceItem = {
  accessibilityLabel: string;
  label: string;
  selectedLabel: string;
  summary: string;
  sourceUri: string;
};

export function recordingWhisperModelPathTarget(item: RecordingWhisperModelChoiceItem) {
  return item.sourceUri;
}

export function recordingWhisperModelStatusLabel(item: RecordingWhisperModelChoiceItem) {
  return item.label;
}

type RecordingWhisperModelSelectorProps = {
  items: RecordingWhisperModelChoiceItem[];
  onModelPress: (item: RecordingWhisperModelChoiceItem) => void;
  selectedPath: string;
};

export function RecordingWhisperModelSelector({
  items,
  onModelPress,
  selectedPath
}: RecordingWhisperModelSelectorProps) {
  return (
    <View style={styles.actionRow}>
      {items.map((model) => {
        const modelSelected = model.sourceUri === selectedPath;
        return (
          <Pressable
            accessibilityLabel={model.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: modelSelected }}
            key={model.sourceUri}
            onPress={() => onModelPress(model)}
            style={[styles.chip, modelSelected ? styles.chipSelected : null]}
          >
            <Text style={[styles.chipText, modelSelected ? styles.chipTextSelected : null]}>
              {model.label}
            </Text>
            {modelSelected ? <Text style={styles.previewModeBadge}>{model.selectedLabel}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexWrap: "wrap",
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end"
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8E5",
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10
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
  },
  previewModeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF6F1",
    borderColor: "#D6EEE4",
    borderRadius: 999,
    borderWidth: 1,
    color: "#0F3F37",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
  }
});
