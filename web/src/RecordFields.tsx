import { useEffect, useState } from "react";

const fieldLabels: Record<string, string> = {
  value: "數值", unit: "單位", timing: "測量時機", meal_type: "餐別",
  food_items: "餐點", name: "名稱", quantity: "份量", amount: "份量",
  duration_minutes: "時間（分鐘）", duration_min: "時間（分鐘）", duration: "時間",
  activity: "活動", activity_type: "活動類型", exercise_type: "運動類型",
  intensity: "強度", medication_name: "藥品名稱", dose: "劑量", dosage: "劑量",
  dose_unit: "劑量單位", route: "使用方式", notes: "備註", note: "備註",
  description: "內容", systolic: "收縮壓", diastolic: "舒張壓", pulse: "脈搏",
  glucose_value: "血糖值", calories: "熱量", carbs_g: "碳水化合物（克）",
  carbohydrate_g: "碳水化合物（克）", weight: "體重", symptom: "症狀",
};

const choices: Record<string, Record<string, string>> = {
  timing: { fasting: "空腹", pre_meal: "餐前", post_meal: "餐後", bedtime: "睡前", random: "隨機" },
  meal_type: { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "點心" },
  intensity: { low: "輕度", moderate: "中度", high: "高強度" },
  unit: { "mg/dL": "mg/dL", "mmol/L": "mmol/L" },
};

function NumberField({ value, label, disabled, onChange }: {
  value: number; label: string; disabled: boolean; onChange: (value: number) => void;
}) {
  // Keep an empty editing draft local, never send null/NaN to the save payload.
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  return <input aria-label={label} disabled={disabled} type="number" step="any" value={draft}
    onChange={(event) => {
      setDraft(event.target.value);
      if (event.target.value !== "" && Number.isFinite(event.target.valueAsNumber)) onChange(event.target.valueAsNumber);
    }} onBlur={() => { if (draft === "" || !Number.isFinite(Number(draft))) setDraft(String(value)); }} />;
}

/** Edit structured values without exposing JSON syntax or changing unedited keys. */
export function RecordFields({ value, onChange, disabled = false, prefix = "紀錄" }: {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
  prefix?: string;
}) {
  return <div className="record-fields">
    {Object.entries(value).map(([key, item]) => {
      const label = fieldLabels[key] ?? key.replaceAll("_", " ");
      const update = (next: unknown) => onChange({ ...value, [key]: next });
      if (Array.isArray(item)) {
        return <fieldset key={key} disabled={disabled}>
          <legend>{label}</legend>
          {item.map((entry, index) => {
            const name = `${prefix} ${label} ${index + 1}`;
            return entry !== null && typeof entry === "object" && !Array.isArray(entry)
              ? <RecordFields key={index} value={entry as Record<string, unknown>} prefix={name}
                  disabled={disabled} onChange={(next) => update(item.map((old, i) => i === index ? next : old))} />
              : <label key={index}>{`${label} ${index + 1}`}<input aria-label={name} value={String(entry ?? "")}
                  disabled={disabled} onChange={(event) => update(item.map((old, i) => i === index ? event.target.value : old))} /></label>;
          })}
        </fieldset>;
      }
      if (item !== null && typeof item === "object") {
        return <fieldset key={key} disabled={disabled}><legend>{label}</legend>
          <RecordFields value={item as Record<string, unknown>} prefix={`${prefix} ${label}`}
            disabled={disabled} onChange={update} />
        </fieldset>;
      }
      return <label key={key}><span>{label}</span>
        {typeof item === "boolean" ? <select aria-label={`${prefix} ${label}`} disabled={disabled}
          value={String(item)} onChange={(event) => update(event.target.value === "true")}>
          <option value="true">是</option><option value="false">否</option>
        </select> : typeof item === "number" ? <NumberField value={item} label={`${prefix} ${label}`} disabled={disabled} onChange={update} />
          : choices[key] && typeof item === "string" && item in choices[key] ? <select aria-label={`${prefix} ${label}`} disabled={disabled}
              value={item} onChange={(event) => update(event.target.value)}>
              {Object.entries(choices[key]).map(([code, text]) => <option key={code} value={code}>{text}</option>)}
            </select>
          : <input aria-label={`${prefix} ${label}`} disabled={disabled} value={String(item ?? "")}
              onChange={(event) => update(event.target.value)} />}
      </label>;
    })}
  </div>;
}
