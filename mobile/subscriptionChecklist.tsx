import { HighlightBulletRow } from "./highlightBulletRow";

type SubscriptionChecklistProps = {
  items: string[];
};

function subscriptionChecklistItemKey(item: string) {
  return item;
}

function subscriptionChecklistItemText(item: string) {
  return item;
}

export function SubscriptionChecklist({ items }: SubscriptionChecklistProps) {
  return (
    <>
      {items.map((item) => (
        <HighlightBulletRow key={subscriptionChecklistItemKey(item)} text={subscriptionChecklistItemText(item)} />
      ))}
    </>
  );
}
