import { applyCriticalEffect } from '../../module/combat/resolveCritical.js';

export default async function applyCriticalEffectHandler(message, _html, ds) {
  await applyCriticalEffect({
    penalty: Number(ds.penalty) || 0,
    location: ds.location || '',
    zone: ds.zone || '',
    actorId: ds.defActor || ''
  });
}

export const action = 'animabf-apply-critical-effect';
