const makeResistanceMutator = (key, attrKey) => {
  const fnBase = (data) => {
    const presence = data.general.presence.final.value;
    const attr = data.characteristics.primaries[attrKey];
    const resistance = data.characteristics.secondaries.resistances[key];
    resistance.base.value = presence + attr.mod.value;
  };
  fnBase.abfFlow = {
    deps: [
      "system.general.presence.final.value",
      `system.characteristics.primaries.${attrKey}.final.value`
    ],
    mods: [`system.characteristics.secondaries.resistances.${key}.base.value`]
  };
  Object.defineProperty(fnBase, "name", { value: `mutate${capitalize(key)}ResistanceBase` });
  const fnFinal = (data) => {
    const resistance = data.characteristics.secondaries.resistances[key];
    resistance.final.value = resistance.base.value + resistance.special.value;
  };
  fnFinal.abfFlow = {
    deps: [
      `system.characteristics.secondaries.resistances.${key}.base.value`,
      `system.characteristics.secondaries.resistances.${key}.special.value`
    ],
    mods: [`system.characteristics.secondaries.resistances.${key}.final.value`]
  };
  Object.defineProperty(fnFinal, "name", { value: `mutate${capitalize(key)}ResistanceFinal` });
  return { fnBase, fnFinal };
};
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
const physicalR = makeResistanceMutator("physical", "constitution");
const diseaseR = makeResistanceMutator("disease", "constitution");
const poisonR = makeResistanceMutator("poison", "constitution");
const magicR = makeResistanceMutator("magic", "power");
const psychicR = makeResistanceMutator("psychic", "willPower");
const mutatePhysicalResistanceBase = physicalR.fnBase;
const mutatePhysicalResistanceFinal = physicalR.fnFinal;
const mutateDiseaseResistanceBase = diseaseR.fnBase;
const mutateDiseaseResistanceFinal = diseaseR.fnFinal;
const mutatePoisonResistanceBase = poisonR.fnBase;
const mutatePoisonResistanceFinal = poisonR.fnFinal;
const mutateMagicResistanceBase = magicR.fnBase;
const mutateMagicResistanceFinal = magicR.fnFinal;
const mutatePsychicResistanceBase = psychicR.fnBase;
const mutatePsychicResistanceFinal = psychicR.fnFinal;
export {
  mutateDiseaseResistanceBase,
  mutateDiseaseResistanceFinal,
  mutateMagicResistanceBase,
  mutateMagicResistanceFinal,
  mutatePhysicalResistanceBase,
  mutatePhysicalResistanceFinal,
  mutatePoisonResistanceBase,
  mutatePoisonResistanceFinal,
  mutatePsychicResistanceBase,
  mutatePsychicResistanceFinal
};
