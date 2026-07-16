import { StyleSheet, Text } from "react-native";

import type { DownloadedModel } from "./modelStorage";
import { downloadedModelDisplayLabel } from "./settingsChoiceDisplay";

type DownloadedModelListProps = {
  models: DownloadedModel[];
};

function downloadedModelRowKey(model: DownloadedModel) {
  return model.uri;
}

function downloadedModelRowLabel(model: DownloadedModel) {
  return downloadedModelDisplayLabel(model);
}

export function DownloadedModelList({ models }: DownloadedModelListProps) {
  return (
    <>
      {models.map((model) => (
        <Text key={downloadedModelRowKey(model)} style={styles.rejectedText}>
          {downloadedModelRowLabel(model)}
        </Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  rejectedText: {
    color: "#6F4B00",
    fontSize: 13,
    lineHeight: 20
  }
});
