import { StyleSheet, Text, View } from "react-native";

import { DetailRow } from "./detailRow";
import { FieldLabel } from "./fieldLabel";
import { HighlightBulletRow } from "./highlightBulletRow";

type RecordDetailInfoRow = {
  label: string;
  value: string;
};

type RecordDetailInfoPanelProps = {
  boundaryItems: string[];
  boundaryTitle: string;
  dateLabel: string;
  dateTimeLabel: string;
  dateValue: string;
  exerciseValue: string;
  mainInfoTitle: string;
  medicationValue: string;
  payloadSummary: string;
  sourceTitle: string;
  sourceValue: string;
  supplementalInfoTitle: string;
  timeLabel: string;
  timeValue: string;
  typeLabel: string;
  typeValue: string;
  detailRows: RecordDetailInfoRow[];
};

function recordDetailInfoRowKey(row: RecordDetailInfoRow) {
  return row.label;
}

function recordDetailInfoRowLabel(row: RecordDetailInfoRow) {
  return row.label;
}

function recordDetailInfoRowValue(row: RecordDetailInfoRow) {
  return row.value;
}

export function RecordDetailInfoPanel({
  boundaryItems,
  boundaryTitle,
  dateLabel,
  dateTimeLabel,
  dateValue,
  detailRows,
  exerciseValue,
  mainInfoTitle,
  medicationValue,
  payloadSummary,
  sourceTitle,
  sourceValue,
  supplementalInfoTitle,
  timeLabel,
  timeValue,
  typeLabel,
  typeValue
}: RecordDetailInfoPanelProps) {
  return (
    <>
      <View style={styles.detailHero}>
        <Text style={styles.confidence}>{dateTimeLabel}</Text>
        <Text style={styles.detailValue}>{payloadSummary}</Text>
        <Text style={styles.evidence}>{typeValue}</Text>
      </View>
      <View style={styles.detailRows}>
        <Text style={styles.label}>{mainInfoTitle}</Text>
        <DetailRow label={<FieldLabel icon={"📅"} label={dateLabel} />} value={dateValue} />
        <DetailRow label={<FieldLabel icon={"🕒"} label={timeLabel} />} value={timeValue} />
        <DetailRow label={<FieldLabel icon={"🏷"} label={typeLabel} />} value={typeValue} />
        {detailRows.map((row) => (
          <DetailRow key={recordDetailInfoRowKey(row)} label={recordDetailInfoRowLabel(row)} value={recordDetailInfoRowValue(row)} />
        ))}
      </View>
      <View style={styles.detailRows}>
        <Text style={styles.label}>{supplementalInfoTitle}</Text>
        <DetailRow label={sourceTitle} value={sourceValue} />
        <DetailRow label={<FieldLabel icon={"🚶"} label={"運動"} />} value={exerciseValue} />
        <DetailRow label={<FieldLabel icon={"💊"} label={"用藥"} />} value={medicationValue} />
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
  confidence: {
    color: "#5F666A",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  detailHero: {
    backgroundColor: "#EAF6F1",
    borderRadius: 24,
    gap: 6,
    padding: 20
  },
  detailRows: {
    gap: 8,
    paddingVertical: 2
  },
  detailValue: {
    color: "#3FA67F",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38
  },
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
