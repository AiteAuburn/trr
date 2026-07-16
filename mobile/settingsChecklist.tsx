import { HighlightBulletRow } from "./highlightBulletRow";

type SettingsChecklistProps = {
  items: string[];
};

function settingsChecklistItemKey(item: string) {
  return item;
}

function settingsChecklistItemText(item: string) {
  return item;
}

export function SettingsChecklist({ items }: SettingsChecklistProps) {
  return (
    <>
      {items.map((item) => (
        <HighlightBulletRow key={settingsChecklistItemKey(item)} text={settingsChecklistItemText(item)} />
      ))}
    </>
  );
}
