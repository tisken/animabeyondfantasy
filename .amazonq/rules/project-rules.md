# AnimaBeyondFoundry — Reglas del proyecto

## Repos y rutas

| Qué | Dónde |
|-----|-------|
| Fork de trabajo | /abftest/AnimaBeyondFoundry |
| Repo test (push libre) | git@github.com:tisken/animabeyondfantasy.git (remote "test") |
| Repo upstream (solo lectura) | https://github.com/LarsLTS/AnimaBeyondFoundry.git (remote "origin") |
| Datos extraídos del juego | /docunima/output/items/ |
| Notas del proyecto anterior | /docunima/DEV_NOTES.md |
| Análisis previos | /docunima/analisis/ |
| PDFs originales | /docunima/doc/ |
| Fichas Excel | /docunima/fichas/ |
| Repo original del sistema | /abftest/AnimaBeyondFoundry-original |

## Git — Identidad y push

```bash
# Identidad
git config user.name "Dragug"
git config user.email "dragug@users.noreply.github.com"

# Push a test
GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o StrictHostKeyChecking=no" git push test main

# Push definitivo (PR a LarsLTS)
# 1. Crear branch: git checkout -b feat/nombre
# 2. Push: GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o StrictHostKeyChecking=no" git push test feat/nombre
# 3. Crear PR en GitHub: tisken/animabeyondfantasy → LarsLTS/AnimaBeyondFoundry
```

## Build y deploy

```bash
# 1. Build
npm run build:prod

# 2. Crear zip (OBLIGATORIO — Foundry instala desde zip)
cd dist && rm -f animabf.zip && zip -r animabf.zip . && cd ..

# 3. Commit + push
git add -A && git commit -m "mensaje" && GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o StrictHostKeyChecking=no" git push test main
```

El zip DEBE incluir node_modules/xlsx/xlsx.js (el build lo genera en dist/node_modules/).
Sin el zip, Foundry da 404 en xlsx y el sistema no carga.

## Manifest para Foundry

```
https://raw.githubusercontent.com/tisken/animabeyondfantasy/main/dist/system.json
```

Download apunta a: `https://github.com/tisken/animabeyondfantasy/raw/main/dist/animabf.zip`

## REGLA DE ORO — No romper actores existentes

- NUNCA cambiar isInternal de un item existente
- NUNCA mover items entre INTERNAL_ITEM_CONFIGURATIONS y ITEM_CONFIGURATIONS
- NUNCA cambiar el type string de un item existente
- Los items internos (kiSkill, martialArt, metamagic, summon, level, etc.) se quedan internos
- Para datos nuevos: crear tipos NUEVOS (ej: martialArtData, kiSkillData, summonData)
- Expandir schemas de embedded existentes (advantage, disadvantage, mentalPattern) es SEGURO

## Items internos (NO TOCAR isInternal)

kiSkill, nemesisSkill, arsMagnus, martialArt, creature, specialSkill,
metamagic, summon, level, inventoryItem, elan, elanPower, contact, title,
language, combatSpecialSkill, combatTable, secondarySpecialSkill,
selectedSpell, spellMaintenance, preparedSpell, actVia, innateMagicVia,
innatePsychicPower

## Items embedded (se pueden expandir campos)

advantage, disadvantage, note, ammo, armor, spell, psychicPower,
technique, weapon, effect, mentalPattern, psychicDiscipline, supernaturalShield

## Tipos nuevos creados (embedded, arrastrables desde compendio)

category, martialArtData, kiSkillData, metamagicData, summonData, raceData, magicItemData

## Datos disponibles en /docunima/output/items/

| Archivo | Items | Usado |
|---------|-------|-------|
| advantages_excel.json | 314 (292 reales) | ✅ pack advantages |
| disadvantages.json | 15 | ✅ pack disadvantages |
| categories_excel.json | 22 | ✅ pack categories |
| martial_arts_excel.json | 90 (88 reales) | ✅ pack martial_arts |
| ki_tree_excel.json | 54 | ✅ pack ki_skills |
| ki_skills.json | 10 (efectos manuales) | ✅ merged con ki_tree |
| metamagic.json | 22 | ✅ pack metamagic |
| great_beasts.json | 21 | ✅ pack summons |
| arcana_complete.json | 44 | ✅ pack summons |
| mental_patterns_excel.json | 16 | ✅ pack mental_patterns |
| races_excel.json | 21 | ✅ pack races |
| magic_items.json | 27 | ✅ pack magic_items |
| poisons.json | 5 | ❌ muestra pequeña |
| traps.json | 5 | ❌ muestra pequeña |
| psychic_crystals.json | 3 | ❌ muestra |
| psychic_disciplines.json | 14 | ❌ duplicado (ya en psychic_powers) |
| creatures_sample.json | 3 | ❌ muestra |
| familiar_rules.json | dict | ❌ reglas, no items |

## Versiones

Siempre subir versión en src/system.json antes de push.
Foundry cachea el manifest y no actualiza si la versión no cambia.

## Foundry v13

- El fork usa Foundry v13 (13.351) verificado hasta v14.359
- game.system.template está deprecated en v13, usar game.system.documentTypes
- Los imports de xlsx se resuelven via node_modules/ dentro del zip
- El build de Vite con preserveModules mantiene rutas relativas

## Lecciones aprendidas

### NO registrar tipos nuevos en ITEM_CONFIGURATIONS
Los tipos nuevos (category, martialArtData, etc.) NO deben ir en ITEM_CONFIGURATIONS
porque cleanFieldPath intenta acceder a actor.itemTypes[type] que no existe.
Solo necesitan hasSheet detection en ABFItemSheet.js (array newTypes).

### Chat action handlers
Patrón correcto: `export default async function nombre(message, _html, ds) {}` + `export const action = 'id';`
Se auto-descubren via import.meta.glob en chatActionHandlers.js.
NO usar handler.action = 'id' como propiedad estática.

### Zip obligatorio para Foundry
Foundry instala desde zip. El zip debe incluir node_modules/xlsx/xlsx.js.
Sin el zip, Foundry da 404 en xlsx y el sistema no carga.
El GitHub archive URL NO funciona (mete subcarpeta).

### No tocar isInternal
Cambiar isInternal de true a false rompe actores existentes.
Para datos nuevos: crear tipos NUEVOS con nombres diferentes (ej: martialArtData en vez de martialArt).

### Campos editables vs calculados
En los modifiers del actor: .base es editable, .special es calculado, .final es el resultado.
Para aplicar penalizadores programáticamente, usar .base.

### Estilo de chat messages
Usar clases: animabf-chat-message combat-result-message + group + group-header + group-body.
No usar emojis. No usar estilos inline excesivos. Seguir el patrón de combat-result.hbs.

### Templates de items
Path: templates/items/{type}/{type}.hbs
Usar base-sheet.hbs como wrapper.
Clases: item-sheet-body, item-field, item-row, h4 para secciones.
No usar partials del sistema (vertical-titled-input) para tipos nuevos — HTML directo es más simple.
