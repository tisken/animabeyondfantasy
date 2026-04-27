import { roundTo5Multiples } from "../../../../../../combat/utils/roundTo5Multiples.js";
import { calculateInnateMagic } from "./calculations/calculateInnateMagic.js";
const mutateActMain = (data) => {
  const allActionsPenalty = data.general.modifiers.allActions.final.value;
  const { mystic } = data;
  mystic.act.main.final.value = Math.max(
    mystic.act.main.base.value + Math.min(0, -roundTo5Multiples(-allActionsPenalty / 2)),
    0
  );
};
mutateActMain.abfFlow = {
  deps: [
    "system.general.modifiers.allActions.final.value",
    "system.mystic.act.main.base.value"
  ],
  mods: ["system.mystic.act.main.final.value"]
};
const mutateActVias = (data) => {
  const allActionsPenalty = data.general.modifiers.allActions.final.value;
  const { mystic } = data;
  if (mystic.act.via.length !== 0) {
    for (const actVia of mystic.act.via) {
      actVia.system.final.value = Math.max(
        actVia.system.base.value + Math.min(0, -roundTo5Multiples(-allActionsPenalty / 2)),
        0
      );
    }
  }
};
mutateActVias.abfFlow = {
  deps: [
    "system.general.modifiers.allActions.final.value",
    "system.mystic.act.via"
  ],
  mods: ["system.mystic.act.via"]
};
const mutateInnateMagicMain = (data) => {
  const { mystic } = data;
  mystic.innateMagic.main.final.value = mystic.innateMagic.main.base.value + calculateInnateMagic(mystic.act.main.final.value);
};
mutateInnateMagicMain.abfFlow = {
  deps: [
    "system.mystic.act.main.final.value",
    "system.mystic.innateMagic.main.base.value"
  ],
  mods: ["system.mystic.innateMagic.main.final.value"]
};
const mutateInnateMagicVias = (data) => {
  const { mystic } = data;
  if (mystic.innateMagic.via.length !== 0) {
    for (const innateMagicVia of mystic.innateMagic.via) {
      const actVia = mystic.act.via.find((i) => i.name == innateMagicVia.name);
      const actViaValue = mystic.act.via.length !== 0 && actVia ? actVia.system.final.value : mystic.act.main.final.value;
      innateMagicVia.system.final.value = innateMagicVia.system.base.value + calculateInnateMagic(actViaValue);
    }
  }
};
mutateInnateMagicVias.abfFlow = {
  deps: [
    "system.mystic.act.main.final.value",
    "system.mystic.act.via",
    "system.mystic.innateMagic.via"
  ],
  mods: [
    "system.mystic.innateMagic.via"
  ]
};
const mutateMagicProjection = (data) => {
  const allActionsPenalty = data.general.modifiers.allActions.final.value;
  const { mystic } = data;
  mystic.magicProjection.final.value = Math.max(
    mystic.magicProjection.base.value + allActionsPenalty,
    0
  );
};
mutateMagicProjection.abfFlow = {
  deps: [
    "system.general.modifiers.allActions.final.value",
    "system.mystic.magicProjection.base.value"
  ],
  mods: ["system.mystic.magicProjection.final.value"]
};
const mutateMagicProjectionOffensive = (data) => {
  const allActionsPenalty = data.general.modifiers.allActions.final.value;
  const { mystic } = data;
  mystic.magicProjection.imbalance.offensive.final.value = Math.max(
    mystic.magicProjection.imbalance.offensive.base.value + allActionsPenalty,
    0
  );
};
mutateMagicProjectionOffensive.abfFlow = {
  deps: [
    "system.general.modifiers.allActions.final.value",
    "system.mystic.magicProjection.imbalance.offensive.base.value"
  ],
  mods: ["system.mystic.magicProjection.imbalance.offensive.final.value"]
};
const mutateMagicProjectionDefensive = (data) => {
  const allActionsPenalty = data.general.modifiers.allActions.final.value;
  const { mystic } = data;
  mystic.magicProjection.imbalance.defensive.final.value = Math.max(
    mystic.magicProjection.imbalance.defensive.base.value + allActionsPenalty,
    0
  );
};
mutateMagicProjectionDefensive.abfFlow = {
  deps: [
    "system.general.modifiers.allActions.final.value",
    "system.mystic.magicProjection.imbalance.defensive.base.value"
  ],
  mods: ["system.mystic.magicProjection.imbalance.defensive.final.value"]
};
const mutateZeonMaintenance = (data) => {
  const { mystic } = data;
  const dailyZeon = mystic.spellMaintenances.reduce(
    (acc, currentValue) => acc + (Number(currentValue.system.cost.value) || 0),
    0
  );
  const perTurnZeon = mystic.selectedSpells.reduce(
    (acc, currentValue) => acc + (Number(currentValue.system.cost.value) || 0),
    0
  );
  mystic.spellsMaintenanceCost = perTurnZeon;
  const manualMaintained = Number(mystic.zeonMaintained?.max) || 0;
  mystic.zeonMaintained.value = perTurnZeon + manualMaintained;
  mystic.zeonRegeneration.final.value = mystic.zeonRegeneration.base.value - dailyZeon;
};
mutateZeonMaintenance.abfFlow = {
  deps: [
    "system.mystic.spellMaintenances",
    "system.mystic.selectedSpells",
    "system.mystic.zeonMaintained.max",
    "system.mystic.zeonRegeneration.base.value"
  ],
  mods: [
    "system.mystic.spellsMaintenanceCost",
    "system.mystic.zeonMaintained.value",
    "system.mystic.zeonRegeneration.final.value"
  ]
};
const makeSummoningMutator = (key) => {
  const fn = (data) => {
    const allActionsPenalty = data.general.modifiers.allActions.final.value;
    data.mystic.summoning[key].final.value = data.mystic.summoning[key].base.value + Math.min(allActionsPenalty, 0);
  };
  fn.abfFlow = {
    deps: [
      "system.general.modifiers.allActions.final.value",
      `system.mystic.summoning.${key}.base.value`
    ],
    mods: [`system.mystic.summoning.${key}.final.value`]
  };
  Object.defineProperty(fn, "name", { value: `mutateSummoning_${key}` });
  return fn;
};
const mutateSummoningSummon = makeSummoningMutator("summon");
const mutateSummoningBanish = makeSummoningMutator("banish");
const mutateSummoningBind = makeSummoningMutator("bind");
const mutateSummoningControl = makeSummoningMutator("control");
const mutatePreparedSpells = (data) => {
  const { mystic } = data;
  if (mystic.preparedSpells.length !== 0) {
    for (let preparedSpell of mystic.preparedSpells) {
      let prepared = preparedSpell.system.prepared.value;
      if (prepared) {
        preparedSpell.system.zeonAcc.value = preparedSpell.system.zeonAcc.max;
      }
    }
  }
};
mutatePreparedSpells.abfFlow = {
  deps: ["system.mystic.preparedSpells"],
  mods: ["system.mystic.preparedSpells"]
};
export {
  mutateActMain,
  mutateActVias,
  mutateInnateMagicMain,
  mutateInnateMagicVias,
  mutateMagicProjection,
  mutateMagicProjectionDefensive,
  mutateMagicProjectionOffensive,
  mutatePreparedSpells,
  mutateSummoningBanish,
  mutateSummoningBind,
  mutateSummoningControl,
  mutateSummoningSummon,
  mutateZeonMaintenance
};
