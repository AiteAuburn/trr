import { HighlightBulletRow } from "./highlightBulletRow";

type InsightFlowChecklistProps = {
  items: string[];
};

function insightFlowChecklistItemKey(item: string) {
  return item;
}

function insightFlowChecklistItemText(item: string) {
  return item;
}

export function InsightFlowChecklist({ items }: InsightFlowChecklistProps) {
  return (
    <>
      {items.map((item) => (
        <HighlightBulletRow key={insightFlowChecklistItemKey(item)} text={insightFlowChecklistItemText(item)} />
      ))}
    </>
  );
}
