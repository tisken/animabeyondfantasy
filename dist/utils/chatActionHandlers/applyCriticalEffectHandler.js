import { applyCriticalEffect } from "../../module/combat/resolveCritical.js";
async function applyCriticalEffectHandler(message, _html, ds) {
  await applyCriticalEffect({
    penalty: Number(ds.penalty) || 0,
    location: ds.location || "",
    zone: ds.zone || "",
    actorId: ds.defActor || ""
  });
}
const action = "animabf-apply-critical-effect";
export {
  action,
  applyCriticalEffectHandler as default
};
