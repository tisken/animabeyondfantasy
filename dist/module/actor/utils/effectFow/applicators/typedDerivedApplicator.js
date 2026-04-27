function keyFromAbsPath(absPath) {
  const parts = absPath.split(".");
  const last = parts.at(-1);
  if (last === "value" && parts.length >= 2) return parts.at(-2);
  return last;
}
function applyTypedDerivedSpec(actor, specAbs) {
  const inputs = {};
  for (const p of specAbs.depsAbs) {
    const k = keyFromAbsPath(p);
    if (k in inputs) continue;
    inputs[k] = foundry.utils.getProperty(actor, p);
  }
  const out = specAbs.compute(inputs) ?? {};
  for (const w of specAbs.writes) {
    const key = keyFromAbsPath(w.path);
    if (!(key in out)) continue;
    const current = foundry.utils.getProperty(actor, w.path);
    const next = out[key];
    if (w.kind === "modify" && typeof current === "number" && typeof next === "number") {
      foundry.utils.setProperty(actor, w.path, current + next);
    } else {
      foundry.utils.setProperty(actor, w.path, next);
    }
  }
}
export {
  applyTypedDerivedSpec
};
