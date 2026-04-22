/**
 * @module combat/targeting
 *
 * Enhanced targeting system inspired by PF2e's target resolution.
 * Handles:
 * - Single target (melee/ranged attack)
 * - Multi-target (area spells, psychic powers)
 * - Area template placement and token detection
 * - Distance calculation between tokens
 */

/**
 * @typedef {Object} ResolvedTarget
 * @property {string} actorUuid
 * @property {string} tokenUuid
 * @property {string} label
 * @property {number|null} distance - Distance from origin in meters
 * @property {boolean} auto - Whether auto-detected from area
 * @property {string} state
 * @property {number} updatedAt
 */

/**
 * Snapshot currently targeted tokens for the given user.
 * Enhanced version of the original getSnapshotTargets.
 *
 * @param {object} [options]
 * @param {any} [options.user] - The user whose targets to snapshot (default: game.user)
 * @param {any} [options.originToken] - The attacking token, used for distance calc
 * @returns {ResolvedTarget[]}
 */
export function getSnapshotTargets({ user, originToken } = {}) {
  const u = user ?? game.user;
  return Array.from(u?.targets ?? [])
    .map(t => {
      const tok = t?.document ?? t;
      const actorUuid = tok?.actor?.id ?? tok?.actorId ?? '';
      const tokenUuid = tok?.uuid ?? tok?.document?.uuid ?? tok?.id ?? '';
      const label = tok?.name ?? tok?.actor?.name ?? '';

      if (!actorUuid || !tokenUuid) return null;

      const distance = originToken ? measureTokenDistance(originToken, t) : null;

      return {
        actorUuid,
        tokenUuid,
        label,
        distance,
        auto: false,
        state: 'pending',
        updatedAt: Date.now()
      };
    })
    .filter(Boolean);
}

/**
 * Resolve targets inside a measured template area on the canvas.
 * Returns all tokens whose center falls within the template shape.
 *
 * @param {object} area - EffectArea data { type, value, width? }
 * @param {object} origin - { x, y } center point of the area
 * @param {object} [options]
 * @param {number} [options.maxTargets] - Max targets to return (0 = all)
 * @param {string[]} [options.excludeTokenIds] - Token IDs to exclude (e.g. caster)
 * @returns {ResolvedTarget[]}
 */
export function resolveAreaTargets(area, origin, options = {}) {
  if (!canvas?.tokens?.placeables) return [];

  const { maxTargets = 0, excludeTokenIds = [] } = options;
  const radiusMeters = area.value ?? 0;
  const radiusPx = radiusMeters * (canvas.dimensions?.distancePixels ?? 1);

  const candidates = canvas.tokens.placeables
    .filter(t => {
      if (excludeTokenIds.includes(t.id)) return false;
      if (!t.actor) return false;
      return isTokenInArea(t, area, origin, radiusPx);
    })
    .map(t => {
      const tok = t.document ?? t;
      const dist = pixelsToMeters(
        Math.hypot(t.center.x - origin.x, t.center.y - origin.y)
      );
      return {
        actorUuid: tok.actor?.id ?? tok.actorId ?? '',
        tokenUuid: tok.uuid ?? tok.id ?? '',
        label: tok.name ?? tok.actor?.name ?? '',
        distance: Math.round(dist * 10) / 10,
        auto: true,
        state: 'pending',
        updatedAt: Date.now()
      };
    })
    .filter(t => t.actorUuid)
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

  if (maxTargets > 0) return candidates.slice(0, maxTargets);
  return candidates;
}

/**
 * Measure distance between two tokens in meters.
 * Uses Foundry's grid measurement when available.
 *
 * @param {any} tokenA
 * @param {any} tokenB
 * @returns {number|null} Distance in meters, or null if can't measure
 */
export function measureTokenDistance(tokenA, tokenB) {
  try {
    const a = tokenA?.object?.center ?? tokenA?.center ?? tokenA;
    const b = tokenB?.object?.center ?? tokenB?.center ?? tokenB;
    if (!a?.x || !b?.x) return null;

    if (canvas?.grid?.measurePath) {
      return canvas.grid.measurePath([a, b]).distance;
    }
    if (canvas?.grid?.measureDistance) {
      return canvas.grid.measureDistance(a, b, { gridSpaces: true });
    }

    // Fallback: Euclidean in pixels → meters
    return pixelsToMeters(Math.hypot(a.x - b.x, a.y - b.y));
  } catch {
    return null;
  }
}

/**
 * Check if a token's center is inside an area shape.
 */
function isTokenInArea(token, area, origin, radiusPx) {
  const center = token.center ?? token.object?.center;
  if (!center) return false;

  const dx = center.x - origin.x;
  const dy = center.y - origin.y;
  const dist = Math.hypot(dx, dy);

  switch (area.type) {
    case 'circle':
      return dist <= radiusPx;
    case 'cone': {
      // Simple 90° cone facing the direction of the area
      if (dist > radiusPx) return false;
      const angle = Math.atan2(dy, dx);
      const facing = area._facing ?? 0;
      const diff = Math.abs(((angle - facing + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      return diff <= Math.PI / 4; // 90° cone
    }
    case 'rect': {
      const w = (area.width ?? area.value) * (canvas.dimensions?.distancePixels ?? 1);
      const h = radiusPx;
      return Math.abs(dx) <= w / 2 && Math.abs(dy) <= h / 2;
    }
    case 'ray':
      // Simplified: within width of the line
      return dist <= radiusPx && Math.abs(dx * Math.sin(area._facing ?? 0) - dy * Math.cos(area._facing ?? 0)) <= (area.width ?? 1) * (canvas.dimensions?.distancePixels ?? 1) / 2;
    default:
      return dist <= radiusPx;
  }
}

function pixelsToMeters(px) {
  const distPerPx = canvas?.dimensions?.distance / canvas?.dimensions?.size || 1;
  return px * distPerPx;
}
