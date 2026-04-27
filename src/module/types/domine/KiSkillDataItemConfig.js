import { ABFItems } from '../../items/ABFItems';
import { openSimpleInputDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

export const KiSkillDataItemConfig = ABFItemConfigFactory({
  type: ABFItems.KI_SKILL_DATA,
  isInternal: false,
  fieldPath: ['domine', 'kiSkillDatas'],
  selectors: {
    addItemButtonSelector: 'add-ki-skill-data',
    containerSelector: '#ki-skill-data-context-menu-container',
    rowSelector: '.ki-skill-data-row'
  },
  onCreate: async actor => {
    const name = await openSimpleInputDialog({
      content: game.i18n.localize('dialogs.items.kiSkillData.content') || 'Ki Skill name'
    });
    await actor.createItem({ name, type: ABFItems.KI_SKILL_DATA });
  },
  hasSheet: true
});
