/**
 * Roll context: origin (attacker) and target (defender) data.
 *
 * Inspired by PF2e's RollOrigin / RollTarget pattern.
 * Provides a unified structure for attack, defense, spell, and psychic rolls.
 */

export interface RollOrigin {
  /** The actor performing the action */
  actorId: string;
  /** Token UUID on the canvas (if available) */
  tokenUuid?: string;
  /** The item used (weapon, spell, psychic power) */
  itemId?: string;
  /** Computed ability value (attack, magic projection, psychic projection) */
  abilityValue: number;
  /** Modifiers applied to the roll */
  modifiers: RollModifier[];
}

export interface RollTarget {
  actorId: string;
  tokenUuid?: string;
  /** Distance from origin in meters */
  distance: number | null;
  /** Whether this target was auto-detected from area or manually selected */
  auto: boolean;
  /** Current defense state */
  state: TargetState;
}

export type TargetState = 'pending' | 'rolling' | 'done' | 'expired';

export interface RollModifier {
  /** Unique key for this modifier (e.g. 'fatigueUsed', 'blindness') */
  key: string;
  /** Numeric value */
  value: number;
  /** Whether this modifier is currently applied */
  apply: boolean;
  /** Human-readable label */
  label?: string;
}

/**
 * Full roll context for a combat exchange.
 */
export interface CombatRollContext {
  /** The type of action: physical combat, mystic, psychic */
  type: 'combat' | 'mystic' | 'psychic';
  origin: RollOrigin;
  targets: RollTarget[];
  /** Roll options / tags that affect the roll */
  options: Set<string>;
}

/**
 * Create a RollModifier from a key-value pair.
 */
export function createModifier(key: string, value: number, label?: string): RollModifier {
  return { key, value, apply: true, label: label ?? key };
}

/**
 * Sum all applied modifiers.
 */
export function totalModifiers(modifiers: RollModifier[]): number {
  return modifiers.filter(m => m.apply).reduce((sum, m) => sum + m.value, 0);
}
