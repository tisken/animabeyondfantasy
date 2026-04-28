import { resolveCritical } from '../../module/combat/resolveCritical.js';

export default async function resolveCriticalHandler(message, _html, ds) {
  const baseCriticalValue = Number(ds.baseCrit) || 0;
  const defActorId = ds.defActor || '';
  const defTokenId = ds.defToken || '';
  const defenderActor = defActorId ? game.actors.get(defActorId) : null;

  await resolveCritical({
    baseCriticalValue,
    defenderActor,
    defenderTokenId: defTokenId
  });
}

export const action = 'animabf-resolve-critical';
