/**
 * Tags (traits) for spells, psychic powers, and combat abilities.
 *
 * Inspired by PF2e's trait system. In Anima, spells and powers have
 * descriptors that affect how they interact with defenses, resistances,
 * and area effects.
 */

/** Spell action types */
export const SpellActionType = {
  ACTIVE: 'active',
  PASSIVE: 'passive'
} as const;

/** Spell combat interaction */
export const SpellCombatType = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  NONE: 'none'
} as const;

/** Spell category (how it works mechanically) */
export const SpellCategory = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  ANIMATIC: 'animatic',
  EFFECT: 'effect',
  AUTOMATIC: 'automatic',
  DETECTION: 'detection'
} as const;

/** Elemental / via tags for spells */
export const SpellVia = {
  AIR: 'air',
  BLOOD: 'blood',
  CHAOS: 'chaos',
  CREATION: 'creation',
  DARKNESS: 'darkness',
  DEATH: 'death',
  DESTRUCTION: 'destruction',
  DREAMS: 'dreams',
  EARTH: 'earth',
  EMPTINESS: 'emptiness',
  ESSENCE: 'essence',
  FIRE: 'fire',
  FREE_ACCESS: 'freeAccess',
  ILLUSION: 'illusion',
  KNOWLEDGE: 'knowledge',
  LIGHT: 'light',
  LITERAE: 'literae',
  MUSICAL: 'musical',
  NECROMANCY: 'necromancy',
  NOBILITY: 'nobility',
  PEACE: 'peace',
  SIN: 'sin',
  THRESHOLD: 'threshold',
  TIME: 'time',
  WAR: 'war',
  WATER: 'water'
} as const;

/** Delivery method tags */
export const DeliveryTag = {
  PROJECTILE: 'projectile',
  MELEE: 'melee',
  AREA: 'area',
  SELF: 'self',
  TOUCH: 'touch'
} as const;

/** Resistance effect tags (what the target must resist) */
export const ResistanceTag = {
  PHYSICAL: 'physical',
  DISEASE: 'disease',
  POISON: 'poison',
  MAGIC: 'magic',
  PSYCHIC: 'psychic'
} as const;

/** Special effect tags */
export const EffectTag = {
  MAINTAINED: 'maintained',
  DAILY_MAINTENANCE: 'dailyMaintenance',
  AFFECTS_INMATERIAL: 'affectsInmaterial',
  IGNORES_ARMOR: 'ignoresArmor',
  REDUCED_ARMOR: 'reducedArmor',
  AUTOMATIC_CRIT: 'automaticCrit'
} as const;

export type SpellActionTypeValue = typeof SpellActionType[keyof typeof SpellActionType];
export type SpellCombatTypeValue = typeof SpellCombatType[keyof typeof SpellCombatType];
export type SpellCategoryValue = typeof SpellCategory[keyof typeof SpellCategory];
export type SpellViaValue = typeof SpellVia[keyof typeof SpellVia];
export type DeliveryTagValue = typeof DeliveryTag[keyof typeof DeliveryTag];
export type ResistanceTagValue = typeof ResistanceTag[keyof typeof ResistanceTag];
export type EffectTagValue = typeof EffectTag[keyof typeof EffectTag];

/**
 * A set of tags describing a spell or power's properties.
 * Used for roll option resolution (like PF2e's roll options).
 */
export interface ItemTags {
  action?: SpellActionTypeValue;
  combat?: SpellCombatTypeValue;
  category?: SpellCategoryValue;
  via?: SpellViaValue;
  delivery?: DeliveryTagValue[];
  resistance?: ResistanceTagValue;
  effects?: EffectTagValue[];
}

/**
 * Build roll option strings from item tags.
 * Example: ['spell:action:active', 'spell:combat:attack', 'spell:via:fire', 'spell:delivery:area']
 */
export function buildRollOptions(prefix: string, tags: ItemTags): string[] {
  const opts: string[] = [];
  if (tags.action) opts.push(`${prefix}:action:${tags.action}`);
  if (tags.combat) opts.push(`${prefix}:combat:${tags.combat}`);
  if (tags.category) opts.push(`${prefix}:category:${tags.category}`);
  if (tags.via) opts.push(`${prefix}:via:${tags.via}`);
  if (tags.delivery) {
    for (const d of tags.delivery) opts.push(`${prefix}:delivery:${d}`);
  }
  if (tags.resistance) opts.push(`${prefix}:resistance:${tags.resistance}`);
  if (tags.effects) {
    for (const e of tags.effects) opts.push(`${prefix}:effect:${e}`);
  }
  return opts;
}
