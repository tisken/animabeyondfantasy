import { resolveCritical } from '../../module/combat/resolveCritical.js';

async function handler(message, html, dataset) {
  const baseCriticalValue = Number(dataset.baseCrit) || 0;
  const defActorId = dataset.defActor || '';
  const defTokenId = dataset.defToken || '';

  const defenderActor = defActorId ? game.actors.get(defActorId) : null;

  await resolveCritical({
    baseCriticalValue,
    defenderActor,
    defenderTokenId: defTokenId
  });
}

handler.action = 'animabf-resolve-critical';
export { handler as default };
export const action = 'animabf-resolve-critical';
