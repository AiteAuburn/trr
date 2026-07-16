import { HighlightBulletRow } from "./highlightBulletRow";

type FutureReadinessChecklistProps = {
  items: string[];
};

function futureReadinessChecklistItemKey(item: string) {
  return item;
}

function futureReadinessChecklistItemText(item: string) {
  return item;
}

export function FutureReadinessChecklist({ items }: FutureReadinessChecklistProps) {
  return (
    <>
      {items.map((item) => (
        <HighlightBulletRow key={futureReadinessChecklistItemKey(item)} text={futureReadinessChecklistItemText(item)} />
      ))}
    </>
  );
}
