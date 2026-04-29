# Sesión de trabajo — Resumen completo

## Estado final: v2.3.0-test.26

---

## COMPENDIOS (11 packs, 622+ items)

| Pack | Items | Tipo | Datos |
|------|-------|------|-------|
| Ventajas | 230 | advantage | cost, category, description, effectData |
| Desventajas | 62 | disadvantage | benefit, category, description, effectData |
| Artes Marciales | 88 | martialArtData | grade, artType (normal/arcana), 9 bonos combate, CM, penalizaciones HA/HE/HP |
| Invocaciones | 65 | summonData | summonType (normal/invertido/granBestia), poderes múltiples, pacto |
| Habilidades Ki | 54 | kiSkillData | CM, cost, stat, effect, maintenance |
| Habilidades Némesis | 19 | nemesisSkillData | CM, cost, effect, maintenance |
| Objetos Mágicos | 27 | magicItemData | tier, powerLevel, fabula, effect, source |
| Categorías | 22 | category | 17 costes PD, stats por nivel, límites, arquetipos |
| Metamagia | 24 | metamagicData | grade, branch, spheres (max), effect con tiers detallados |
| Razas | 21 | raceData | raceType (race/nephilim/creature), 8 stats, 5 resistencias, tamaño, regen |
| Patrones Mentales | 16 | mentalPattern | cost, cost2, opposite, bonus, penalty, description |

## TIPOS NUEVOS CREADOS (no rompen nada existente)

Todos son embedded (isInternal: false), NO están en ITEM_CONFIGURATIONS.
La detección de sheet se hace en ABFItemSheet.js directamente.

- category, martialArtData, kiSkillData, metamagicData, summonData
- raceData, magicItemData, nemesisSkillData
- artifactWeapon, artifactArmor, kiTechniqueData

## SCHEMAS EXPANDIDOS (embedded existentes, seguro)

- advantage: añadido cost, category, description, effectData
- disadvantage: añadido benefit, category, description, effectData
- mentalPattern: añadido cost, cost2, opposite, description
- weapon: añadido description (textarea para habilidades especiales)
- armor: añadido description (textarea para habilidades especiales)

## ITEM SHEETS (templates HBS)

Creadas para todos los tipos nuevos + advantage + disadvantage + mentalPattern.
Todas en src/templates/items/{type}/{type}.hbs
Estilo: item-sheet-body con item-field, item-row, h4 para secciones.

## BUGFIXES

1. Contraataque en empate: difference <= 0 → difference < 0 (computeCombatResult.js)
2. Cap contraataque: añadido Math.min(..., 150) (computeCombatResult.js)

## SISTEMA DE CRÍTICOS (nuevo)

Archivo: src/module/combat/resolveCritical.js
Handlers: src/utils/chatActionHandlers/resolveCriticalHandler.js + applyCriticalEffectHandler.js
Botón: en src/templates/chat/combat-result.hbs

Flujo:
1. Combate detecta crítico → muestra botón "Resolver Crítico" en chat
2. Al clickar: tira 1d100 (sin abierta) + baseCriticalValue (que ya incluye critBonus del ataque)
3. Si > 200, exceso se reduce a mitad
4. Defensor tira RF (1d100 + RF)
5. Nivel final = crit - RF
6. Si > 50: tira localización (1d100, tabla de 19 localizaciones)
7. Severidad: Menor (1-50) / Mayor (51-100) / Grave (101-150) / Devastador (151+)
8. Botón "Aplicar Penalizador" → escribe en physicalActions.base del actor

Recuperación:
- Dolor: 5 puntos por asalto
- Físico: 5 puntos por semana
- Miembro destrozado: solo curación sobrenatural
- Muerte: cabeza o corazón en grave/devastador

## ARCHIVOS JS MODIFICADOS

- src/module/items/ABFItems.js — añadidos tipos nuevos al final
- src/module/items/ABFItemSheet.js — añadida detección de tipos nuevos para sheets
- src/module/combat/computeCombatResult.js — bugfixes contraataque
- src/module/combat/resolveCritical.js — NUEVO, sistema de críticos
- src/utils/chatActionHandlers/resolveCriticalHandler.js — NUEVO
- src/utils/chatActionHandlers/applyCriticalEffectHandler.js — NUEVO
- src/templates/chat/combat-result.hbs — añadido botón Resolver Crítico

## ARCHIVOS NO TOCADOS (regla de oro)

- INTERNAL_ITEM_CONFIGURATIONS — intacto
- Ningún isInternal cambiado
- ABFActor.js — intacto
- ABFActorSheet.js — intacto (no se añadió pestaña Resumen)
- constants.js (prepareItems) — intacto (los nuevos tipos NO están aquí)
- Ningún item interno existente modificado
