export function trialDaysLeft(trialEndsAt?: string | null) {
  if (!trialEndsAt) {
    return null;
  }
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}
