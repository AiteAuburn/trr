import { HighlightBulletRow } from "./highlightBulletRow";

type OutcomeChecklistProps = {
  items: string[];
};

function outcomeChecklistItemKey(item: string) {
  return item;
}

function outcomeChecklistItemText(item: string) {
  return item;
}

export function OutcomeChecklist({ items }: OutcomeChecklistProps) {
  return (
    <>
      {items.map((item) => (
        <HighlightBulletRow key={outcomeChecklistItemKey(item)} text={outcomeChecklistItemText(item)} />
      ))}
    </>
  );
}
