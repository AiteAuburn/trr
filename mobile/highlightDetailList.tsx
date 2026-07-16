import { HighlightDetailRow } from "./highlightDetailRow";

export type HighlightDetailListRow = {
  label: string;
  value: string;
};

type HighlightDetailListProps = {
  rows: HighlightDetailListRow[];
};

function highlightDetailListRowKey(row: HighlightDetailListRow) {
  return row.label;
}

function highlightDetailListRowLabel(row: HighlightDetailListRow) {
  return row.label;
}

function highlightDetailListRowValue(row: HighlightDetailListRow) {
  return row.value;
}

export function HighlightDetailList({ rows }: HighlightDetailListProps) {
  return (
    <>
      {rows.map((row) => (
        <HighlightDetailRow
          key={highlightDetailListRowKey(row)}
          label={highlightDetailListRowLabel(row)}
          value={highlightDetailListRowValue(row)}
        />
      ))}
    </>
  );
}
