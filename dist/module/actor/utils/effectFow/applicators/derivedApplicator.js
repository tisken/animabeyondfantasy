async function applyDerived(actor, derivedFn) {
  return derivedFn(actor.system);
}
export {
  applyDerived
};
