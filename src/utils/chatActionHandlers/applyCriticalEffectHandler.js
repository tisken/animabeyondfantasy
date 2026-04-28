import { applyCriticalEffect } from '../../module/combat/resolveCritical.js';

async function handler(message, html, dataset) {
  await applyCriticalEffect({
    penalty: Number(dataset.penalty) || 0,
    location: dataset.location || '',
    zone: dataset.zone || '',
    actorId: dataset.defActor || ''
  });
}

handler.action = 'animabf-apply-critical-effect';
export { handler as default };
export const action = 'animabf-apply-critical-effect';
