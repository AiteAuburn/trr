import { HighlightBulletRow } from "./highlightBulletRow";

type YearlyHighlightListProps = {
  items: readonly string[];
};

function yearlyHighlightItemKey(item: string) {
  return item;
}

function yearlyHighlightItemText(item: string) {
  return item;
}

export function YearlyHighlightList({ items }: YearlyHighlightListProps) {
  return (
    <>
      {items.map((item) => (
        <HighlightBulletRow key={yearlyHighlightItemKey(item)} text={yearlyHighlightItemText(item)} />
      ))}
    </>
  );
}
