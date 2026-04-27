import { buildAllFlowOps } from "./ops/buildOps.js";
import { orderFlowOps } from "./toposort.js";
async function runEffectFlow(actor, options = {}) {
  const ops = buildAllFlowOps(actor, options);
  const ordered = orderFlowOps(ops);
  for (const op of ordered) {
    if (options.debug) {
      console.log("[effectFlow] apply", op.id, { deps: op.deps, mods: op.mods });
    }
    await op.apply(actor);
  }
  return ordered;
}
export {
  runEffectFlow
};
