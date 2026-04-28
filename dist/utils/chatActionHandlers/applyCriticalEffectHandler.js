import { applyCriticalEffect } from "../../module/combat/resolveCritical.js";
async function handler(message, html, dataset) {
  const penalty = Number(dataset.penalty) || 0;
  const location = dataset.location || "";
  const zone = dataset.zone || "";
  const actorId = dataset.defActor || "";
  dataset.defToken || "";
  await applyCriticalEffect({
    penalty,
    location,
    zone,
    actorId
  });
}
handler.action = "animabf-apply-critical-effect";
const action = "animabf-apply-critical-effect";
export {
  action,
  handler as default
};
