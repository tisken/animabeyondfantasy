import { ABFItems } from "../../items/ABFItems.js";
import { openSimpleInputDialog } from "../../utils/dialogs/openSimpleInputDialog.js";
import { ABFItemConfigFactory } from "../ABFItemConfig.js";
const RaceDataItemConfig = ABFItemConfigFactory({
  type: ABFItems.RACE_DATA,
  isInternal: false,
  fieldPath: ["general", "raceDatas"],
  selectors: {
    addItemButtonSelector: "add-race-data",
    containerSelector: "#race-data-context-menu-container",
    rowSelector: ".race-data-row"
  },
  onCreate: async (actor) => {
    const name = await openSimpleInputDialog({
      content: game.i18n.localize("dialogs.items.raceData.content") || "Race name"
    });
    await actor.createItem({ name, type: ABFItems.RACE_DATA });
  },
  hasSheet: true
});
export {
  RaceDataItemConfig
};
