const maxIdentifierTextLength = 128;
const maxEmailTextLength = 160;
const maxDisplayTextLength = 120;
const maxMobileProfiles = 20;

export type AccountTransformSource = {
  id: string;
  email: string;
  display_name: string;
};

export type ProfileTransformSource = {
  id: string;
  account_id: string;
  display_name: string;
  relationship: string;
};

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return value.slice(0, maxIdentifierTextLength);
}

export function boundAccount<T extends AccountTransformSource>(value: T): T {
  return {
    ...value,
    id: boundIdentifier(value.id),
    email: boundDisplayText(value.email, maxEmailTextLength),
    display_name: boundDisplayText(value.display_name)
  };
}

export function boundProfile<T extends ProfileTransformSource>(value: T): T {
  return {
    ...value,
    id: boundIdentifier(value.id),
    account_id: boundIdentifier(value.account_id),
    display_name: boundDisplayText(value.display_name),
    relationship: boundDisplayText(value.relationship, 40)
  };
}

export function boundProfiles<T extends ProfileTransformSource>(value: T[]) {
  return value.slice(0, maxMobileProfiles).map(boundProfile);
}

export function activeProfileForId<T extends ProfileTransformSource>(profiles: T[], profileId: string) {
  return profiles.find((profile) => profile.id === profileId) ?? null;
}
