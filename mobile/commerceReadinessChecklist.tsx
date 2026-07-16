import { HighlightBulletRow } from "./highlightBulletRow";

type CommerceReadinessChecklistProps = {
  items: string[];
};

function commerceReadinessChecklistItemKey(item: string) {
  return item;
}

function commerceReadinessChecklistItemText(item: string) {
  return item;
}

export function CommerceReadinessChecklist({ items }: CommerceReadinessChecklistProps) {
  return (
    <>
      {items.map((item) => (
        <HighlightBulletRow key={commerceReadinessChecklistItemKey(item)} text={commerceReadinessChecklistItemText(item)} />
      ))}
    </>
  );
}
