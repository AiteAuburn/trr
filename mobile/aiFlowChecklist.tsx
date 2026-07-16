import { HighlightBulletRow } from "./highlightBulletRow";

type AiFlowChecklistProps = {
  items: string[];
};

function aiFlowChecklistItemKey(item: string) {
  return item;
}

function aiFlowChecklistItemText(item: string) {
  return item;
}

export function AiFlowChecklist({ items }: AiFlowChecklistProps) {
  return (
    <>
      {items.map((item) => (
        <HighlightBulletRow key={aiFlowChecklistItemKey(item)} text={aiFlowChecklistItemText(item)} />
      ))}
    </>
  );
}
