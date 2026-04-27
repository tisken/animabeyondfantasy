import { ABFItems } from '../../items/ABFItems';
import { openSimpleInputDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

export const RaceDataItemConfig = ABFItemConfigFactory({
  type: ABFItems.RACE_DATA,
  isInternal: false,
  fieldPath: ['general', 'raceDatas'],
  selectors: {
    addItemButtonSelector: 'add-race-data',
    containerSelector: '#race-data-context-menu-container',
    rowSelector: '.race-data-row'
  },
  onCreate: async actor => {
    const name = await openSimpleInputDialog({
      content: game.i18n.localize('dialogs.items.raceData.content') || 'Race name'
    });
    await actor.createItem({ name, type: ABFItems.RACE_DATA });
  },
  hasSheet: true
});
