# Roadmap de mejoras — AnimaBeyondFoundry

## Referencia

Buenas prácticas extraídas de sistemas Foundry VTT maduros, adaptadas
al contexto y lógica de AnimaBeyondFoundry.

---

## Fase 0 — Higiene de código ✅

### 0.1 Eliminar console.log en producción ✅
- `runFlow.js`, `createWeaponAttack.js`, `ABFActorSheet.js`

### 0.2 Eliminar globals en `window` ✅
- `window.Websocket` → `game.animabf.websocket`
- `window.ABFFoundryRoll` → `game.animabf.rolls.ABFFoundryRoll`

### 0.3 Eliminar `game.animabf.weapon` / `game.animabf.combat` globals ✅
22 usos → imports directos. `registerGlobalTypes.js` eliminado.

### 0.4 Limpiar tipos globales ✅

---

## Fase 1 — Compatibilidad v13/v14 ✅

- `foundryCompat.ts` centraliza `enrichHTML()` y `createContextMenu()`

---

## Fase 2 — Tipado gradual con TypeScript ✅

### 2.1 Constantes y enums ✅
- `ABFItems.ts` — enum con `as const` y tipo `ABFItemsEnum`
- `src/module/data/combat-constants.ts` — `WeaponCritic`, `NoneWeaponCritic`,
  `DamageType`, `WeaponSize`, etc. con tipos exportados
- `src/module/data/mystic-constants.ts` — `SpellGrades`, `SpellGradeNames`
- `src/module/data/psychic-constants.ts` — `PsychicPowerActionTypes`, etc.
- `WeaponItemConfig.js`, `PsychicPowerItemConfig.js`, `SpellItemConfig.js`
  re-exportan desde los `.ts` canónicos

### 2.2 Utilidades ✅
- `foundryCompat.ts`, `renderTemplates.ts`, `chatVisibility.ts`,
  `isVersionGreater.ts`

### 2.3 Data models ✅
- `src/module/data/area.ts` — `EffectArea`, `EffectAreaShape`, `createEffectAreaLabel`
- `src/module/data/roll-context.ts` — `RollOrigin`, `RollTarget`, `CombatRollContext`,
  `RollModifier`, `createModifier`, `totalModifiers`
- `src/module/data/tags.ts` — `ItemTags`, `SpellVia`, `DeliveryTag`, `ResistanceTag`,
  `EffectTag`, `buildRollOptions`
- `src/module/data/index.ts` — barrel export

---

## Fase 3 — Separación de concerns ✅ (parcial)

### 3.1 ABFActor.js ✅
Extraídos a `actor/actions/`:
- `mysticActions.js` — 6 funciones
- `psychicActions.js` — 2 funciones
- `combatActions.js` — 7 funciones

### 3.2 Targeting system ✅
Nuevo módulo `combat/targeting/`:
- `resolveTargets.js` — `getSnapshotTargets` (mejorado con distancia),
  `resolveAreaTargets` (detección de tokens en área), `measureTokenDistance`
- `placeAreaTemplate.js` — `placeAreaTemplate` (colocación interactiva de
  MeasuredTemplate), `removeAreaTemplate`
- `index.js` — barrel export
- `actor/utils/getSnapshotTargets.js` redirige al nuevo módulo

### Pendiente
- `itemActions.js` — CRUD de items extraído de ABFActor
- `dialogs/combat/utils/combatRoll.js` — fórmula base compartida
- `actor/sheet/effectControls.js` — extraer de ABFActorSheet

---

## Fase 4 — Application V2 (cuando Foundry v16 lo requiera)

### Orden de migración
1. `GenericDialog` / `ConfirmationDialog`
2. `CombatAttackDialog` / `CombatDefenseDialog`
3. `GMCombatDialog`
4. `ABFItemSheet`
5. `ABFActorSheet`

### Patrón V1 → V2
| V1 | V2 |
|----|----|
| `static get defaultOptions()` | `static DEFAULT_OPTIONS` |
| `get template()` | `static PARTS` |
| `getData()` | `_prepareContext(options)` |
| `activateListeners(html)` | `_onRender(context, options)` |
| `_updateObject(event, formData)` | `_onSubmitForm(event, form, formData)` |
| `html.find(...)` (jQuery) | `el.querySelector(...)` (DOM nativo) |

---

## Fase 5 — Integración de área y multi-target en diálogos ← SIGUIENTE

### Objetivo
Conectar el nuevo sistema de targeting/área con los diálogos de combate
existentes para que spells y poderes psíquicos con área funcionen con
selección visual de targets.

### Tareas
1. Añadir campo `area` a `INITIAL_MYSTIC_SPELL_DATA` y `INITIAL_PSYCHIC_POWER_DATA`
2. En `CombatAttackDialog` y `SpellAttackConfigurationDialog`:
   - Si el spell/power tiene `area`, mostrar botón "Colocar área"
   - Llamar a `placeAreaTemplate` → `resolveAreaTargets`
   - Poblar la lista de targets automáticamente
3. En `castSpellGrade.js` y `castPsychicPower.js`:
   - Si hay área, usar `resolveAreaTargets` en vez de `getSnapshotTargets`
4. Usar `ItemTags` y `buildRollOptions` para generar opciones de roll
   que afecten modificadores automáticamente

---

## Notas

- Cada fase es independiente y puede mergearse por separado
- No se cambia lógica de juego ni funcionalidad en fases 0-3
- Los tests existentes deben seguir pasando tras cada fase
- Referencia de estructura: sistemas Foundry VTT maduros
