import { HighlightBulletRow } from "./highlightBulletRow";

type RecordFlowChecklistProps = {
  items: string[];
};

function recordFlowChecklistItemKey(item: string) {
  return item;
}

function recordFlowChecklistItemText(item: string) {
  return item;
}

export function RecordFlowChecklist({ items }: RecordFlowChecklistProps) {
  return (
    <>
      {items.map((item) => (
        <HighlightBulletRow key={recordFlowChecklistItemKey(item)} text={recordFlowChecklistItemText(item)} />
      ))}
    </>
  );
}
