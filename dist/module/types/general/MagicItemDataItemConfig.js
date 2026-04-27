import { ABFItems } from "../../items/ABFItems.js";
import { openSimpleInputDialog } from "../../utils/dialogs/openSimpleInputDialog.js";
import { ABFItemConfigFactory } from "../ABFItemConfig.js";
const MagicItemDataItemConfig = ABFItemConfigFactory({
  type: ABFItems.MAGIC_ITEM_DATA,
  isInternal: false,
  fieldPath: ["general", "magicItemDatas"],
  selectors: {
    addItemButtonSelector: "add-magic-item-data",
    containerSelector: "#magic-item-data-context-menu-container",
    rowSelector: ".magic-item-data-row"
  },
  onCreate: async (actor) => {
    const name = await openSimpleInputDialog({
      content: game.i18n.localize("dialogs.items.magicItemData.content") || "Magic Item name"
    });
    await actor.createItem({ name, type: ABFItems.MAGIC_ITEM_DATA });
  },
  hasSheet: true
});
export {
  MagicItemDataItemConfig
};
