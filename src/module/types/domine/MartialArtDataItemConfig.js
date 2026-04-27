import { ABFItems } from '../../items/ABFItems';
import { openSimpleInputDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

export const MartialArtDataItemConfig = ABFItemConfigFactory({
  type: ABFItems.MARTIAL_ART_DATA,
  isInternal: false,
  fieldPath: ['domine', 'martialArtDatas'],
  selectors: {
    addItemButtonSelector: 'add-martial-art-data',
    containerSelector: '#martial-art-data-context-menu-container',
    rowSelector: '.martial-art-data-row'
  },
  onCreate: async actor => {
    const name = await openSimpleInputDialog({
      content: game.i18n.localize('dialogs.items.martialArtData.content') || 'Martial Art name'
    });
    await actor.createItem({ name, type: ABFItems.MARTIAL_ART_DATA });
  },
  hasSheet: true
});
