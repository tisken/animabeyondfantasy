import { buildActiveEffectChangeOps } from "./builders/buildActiveEffectOps.js";
import { buildDerivedOps } from "./builders/buildDerivedOps.js";
import { buildTypedOps } from "./builders/buildTypedOps.js";
function buildAllFlowOps(actor, options = {}) {
  const derivedFns = options.derivedFns ?? [];
  return [
    ...buildActiveEffectChangeOps(actor),
    ...buildTypedOps(actor),
    ...buildDerivedOps(derivedFns)
  ];
}
export {
  buildAllFlowOps
};
