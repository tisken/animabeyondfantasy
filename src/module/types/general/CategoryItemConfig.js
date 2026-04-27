import { ABFItems } from '../../items/ABFItems';
import { openSimpleInputDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

export const CategoryItemConfig = ABFItemConfigFactory({
  type: ABFItems.CATEGORY,
  isInternal: false,
  fieldPath: ['general', 'categories'],
  selectors: {
    addItemButtonSelector: 'add-category',
    containerSelector: '#categories-context-menu-container',
    rowSelector: '.category-row'
  },
  onCreate: async actor => {
    const name = await openSimpleInputDialog({
      content: game.i18n.localize('dialogs.items.category.content') || 'Category name'
    });
    await actor.createItem({ name, type: ABFItems.CATEGORY });
  },
  hasSheet: true
});
