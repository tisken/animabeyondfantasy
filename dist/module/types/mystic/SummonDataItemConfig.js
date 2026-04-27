import { ABFItems } from "../../items/ABFItems.js";
import { openSimpleInputDialog } from "../../utils/dialogs/openSimpleInputDialog.js";
import { ABFItemConfigFactory } from "../ABFItemConfig.js";
const SummonDataItemConfig = ABFItemConfigFactory({
  type: ABFItems.SUMMON_DATA,
  isInternal: false,
  fieldPath: ["mystic", "summonDatas"],
  selectors: {
    addItemButtonSelector: "add-summon-data",
    containerSelector: "#summon-data-context-menu-container",
    rowSelector: ".summon-data-row"
  },
  onCreate: async (actor) => {
    const name = await openSimpleInputDialog({
      content: game.i18n.localize("dialogs.items.summonData.content") || "Summon name"
    });
    await actor.createItem({ name, type: ABFItems.SUMMON_DATA });
  },
  hasSheet: true
});
export {
  SummonDataItemConfig
};
