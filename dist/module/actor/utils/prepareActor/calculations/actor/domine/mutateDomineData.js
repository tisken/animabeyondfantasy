const makeKiAccumulationMutator = (accum) => {
  const fn = (data) => {
    const allActionsPenalty = data.general.modifiers.allActions.final.value;
    data.domine.kiAccumulation[accum].final.value = Math.max(
      data.domine.kiAccumulation[accum].base.value + Math.min(Math.ceil(allActionsPenalty / 20), 0),
      0
    );
  };
  fn.abfFlow = {
    deps: [
      "system.general.modifiers.allActions.final.value",
      `system.domine.kiAccumulation.${accum}.base.value`
    ],
    mods: [`system.domine.kiAccumulation.${accum}.final.value`]
  };
  Object.defineProperty(fn, "name", { value: `mutateKiAccumulation_${accum}` });
  return fn;
};
const mutateKiAccumulationStrength = makeKiAccumulationMutator("strength");
const mutateKiAccumulationAgility = makeKiAccumulationMutator("agility");
const mutateKiAccumulationDexterity = makeKiAccumulationMutator("dexterity");
const mutateKiAccumulationConstitution = makeKiAccumulationMutator("constitution");
const mutateKiAccumulationWillPower = makeKiAccumulationMutator("willPower");
const mutateKiAccumulationPower = makeKiAccumulationMutator("power");
export {
  mutateKiAccumulationAgility,
  mutateKiAccumulationConstitution,
  mutateKiAccumulationDexterity,
  mutateKiAccumulationPower,
  mutateKiAccumulationStrength,
  mutateKiAccumulationWillPower
};
