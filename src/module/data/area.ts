/**
 * Area effect shapes for spells and psychic powers.
 * Adapted from Foundry VTT measured template types.
 */
export const EffectAreaShape = {
  CIRCLE: 'circle',
  CONE: 'cone',
  RECT: 'rect',
  RAY: 'ray'
} as const;

export type EffectAreaShapeType = typeof EffectAreaShape[keyof typeof EffectAreaShape];

/**
 * Structured area data for a spell or psychic power.
 * Mirrors PF2e's SpellArea but adapted to Anima's distance/area rules.
 *
 * - `type`: the geometric shape
 * - `value`: radius in meters (circle/cone) or length (ray/rect)
 * - `width`: width in meters (ray/rect only)
 * - `details`: free-text override when structured data is insufficient
 * - `selectTargets`: if true, the caster picks targets inside the area manually
 *   (Anima allows "up to X targets within the area")
 * - `maxTargets`: max number of targets the caster can select (0 = unlimited)
 */
export interface EffectArea {
  type: EffectAreaShapeType;
  value: number;
  width?: number;
  details?: string;
  selectTargets?: boolean;
  maxTargets?: number;
}

/**
 * Default empty area (no area effect).
 */
export const NO_AREA: null = null;

/**
 * Build a human-readable label for an area effect.
 */
export function createEffectAreaLabel(area: EffectArea): string {
  const shapeLabels: Record<EffectAreaShapeType, string> = {
    circle: 'Radio',
    cone: 'Cono',
    rect: 'Rectángulo',
    ray: 'Línea'
  };
  const shape = shapeLabels[area.type] ?? area.type;
  const size = area.value ?? 0;
  const suffix = area.maxTargets ? ` (máx. ${area.maxTargets} objetivos)` : '';
  return `${shape} ${size}m${suffix}`;
}
