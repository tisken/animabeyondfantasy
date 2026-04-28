import { resolveCritical } from "../../module/combat/resolveCritical.js";
async function resolveCriticalHandler(message, _html, ds) {
  const baseCriticalValue = Number(ds.baseCrit) || 0;
  const defActorId = ds.defActor || "";
  const defTokenId = ds.defToken || "";
  const defenderActor = defActorId ? game.actors.get(defActorId) : null;
  await resolveCritical({
    baseCriticalValue,
    defenderActor,
    defenderTokenId: defTokenId
  });
}
const action = "animabf-resolve-critical";
export {
  action,
  resolveCriticalHandler as default
};
