export const WeaponEquippedHandType = {
  ONE_HANDED: 'one-handed',
  TWO_HANDED: 'two-handed'
} as const;

export const WeaponKnowledgeType = {
  KNOWN: 'known',
  SIMILAR: 'similar',
  MIXED: 'mixed',
  DIFFERENT: 'different'
} as const;

export const WeaponCritic = {
  CUT: 'cut',
  IMPACT: 'impact',
  THRUST: 'thrust',
  HEAT: 'heat',
  ELECTRICITY: 'electricity',
  COLD: 'cold',
  ENERGY: 'energy'
} as const;

export const NoneWeaponCritic = {
  NONE: '-'
} as const;

export const DamageType = {
  NONE: '-'
} as const;

export const WeaponManageabilityType = {
  ONE_HAND: 'one_hand',
  TWO_HAND: 'two_hands',
  ONE_OR_TWO_HAND: 'one_or_two_hands'
} as const;

export const WeaponShotType = {
  SHOT: 'shot',
  THROW: 'throw'
} as const;

export const WeaponSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  BIG: 'big'
} as const;

export const WeaponSizeProportion = {
  NORMAL: 'normal',
  ENORMOUS: 'enormous',
  GIANT: 'giant'
} as const;

export type WeaponCriticType = typeof WeaponCritic[keyof typeof WeaponCritic];
export type NoneWeaponCriticType = typeof NoneWeaponCritic[keyof typeof NoneWeaponCritic];
export type DamageTypeValue = typeof DamageType[keyof typeof DamageType];
export type WeaponShotTypeValue = typeof WeaponShotType[keyof typeof WeaponShotType];
export type WeaponSizeValue = typeof WeaponSize[keyof typeof WeaponSize];
