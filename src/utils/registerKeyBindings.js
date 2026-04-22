import { ABFMacros } from '../module/macros/ABFMacros';

export function registerKeyBindings() {
  game.keybindings.register(game.animabf.id, 'damageCalculator', {
    name: game.i18n.localize('keyBindings.damageCalculator.name'),
    hint: game.i18n.localize('keyBindings.damageCalculator.hint'),
    editable: [
      {
        key: 'Digit1',
        modifiers: ['Control']
      }
    ],
    onDown: () => {
      ABFMacros.damageCalculator();
      return true;
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

  game.keybindings.register(game.animabf.id, 'sendAttack', {
    name: game.i18n.localize('keyBindings.sendAttack.name'),
    hint: game.i18n.localize('keyBindings.sendAttack.hint'),
    editable: [
      {
        key: 'Digit2',
        modifiers: ['Control']
      }
    ],
    onDown: () => {
      if (game.user.isGM) {
        game.animabf.websocket?.sendAttack?.();
      } else {
        game.animabf.websocket?.sendAttackRequest?.();
      }
      return true;
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });
}
