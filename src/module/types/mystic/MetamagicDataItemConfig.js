import { ABFItems } from '../../items/ABFItems';
import { openSimpleInputDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

export const MetamagicDataItemConfig = ABFItemConfigFactory({
  type: ABFItems.METAMAGIC_DATA,
  isInternal: false,
  fieldPath: ['mystic', 'metamagicDatas'],
  selectors: {
    addItemButtonSelector: 'add-metamagic-data',
    containerSelector: '#metamagic-data-context-menu-container',
    rowSelector: '.metamagic-data-row'
  },
  onCreate: async actor => {
    const name = await openSimpleInputDialog({
      content: game.i18n.localize('dialogs.items.metamagicData.content') || 'Metamagic name'
    });
    await actor.createItem({ name, type: ABFItems.METAMAGIC_DATA });
  },
  hasSheet: true
});
