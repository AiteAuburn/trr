import { StyleSheet, Text, View } from "react-native";

type HistoryNoRecordStatusBlockProps = {
  body: string;
  title: string;
};

export function HistoryNoRecordStatusBlock({ body, title }: HistoryNoRecordStatusBlockProps) {
  return (
    <View style={styles.inlineInfoBlock}>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.evidence}>{body}</Text>
    </View>
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
