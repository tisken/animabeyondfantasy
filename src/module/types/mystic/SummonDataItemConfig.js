import { ABFItems } from '../../items/ABFItems';
import { openSimpleInputDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

export const SummonDataItemConfig = ABFItemConfigFactory({
  type: ABFItems.SUMMON_DATA,
  isInternal: false,
  fieldPath: ['mystic', 'summonDatas'],
  selectors: {
    addItemButtonSelector: 'add-summon-data',
    containerSelector: '#summon-data-context-menu-container',
    rowSelector: '.summon-data-row'
  },
  onCreate: async actor => {
    const name = await openSimpleInputDialog({
      content: game.i18n.localize('dialogs.items.summonData.content') || 'Summon name'
    });
    await actor.createItem({ name, type: ABFItems.SUMMON_DATA });
  },
  hasSheet: true
});
