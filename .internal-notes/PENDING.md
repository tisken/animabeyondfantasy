# Pendiente — Próximas sesiones

## PRIORIDAD ALTA

### Pestaña Resumen
- Dashboard principal de juego (layout 2 columnas: info 70% + retrato 30%)
- Combate rollable, armas equipadas, armadura, ki, magia, psíquico, secundarias
- NO tocar ABFActorSheet.js initial tab — solo añadir tab en actor-sheet.hbs
- Usar solo paths hardcoded (no each sobre typed objects)

### Técnicas de Ki — Editor de efectos
- Botones añadir/eliminar efectos en la sheet de kiTechniqueData
- Tabla de efectos disponibles con costes primario vs secundario
- Lógica: efecto primario cuesta menos, secundario cuesta más
- Requiere JS custom en la sheet

### Críticos — Recuperación automática
- El dolor se recupera 5/asalto — podría automatizarse con hook de turno
- El físico se recupera 5/semana — tracking manual por ahora
- Considerar integración con ABFCombat.nextRound()

## PRIORIDAD MEDIA

### Ars Magnus
- Datos en manual Dominus Exxet
- Actualmente solo nombre (internal), necesita tipo nuevo arsMagnusData

### Datos faltantes
- Desventajas: verificar si faltan más del manual (tenemos 62 del Excel)
- Venenos: solo 5 muestras, expandir si hay datos
- Trampas: solo 5 muestras

### PR a LarsLTS
- Branch feat/compendium-packs creado pero necesita actualización
- Incluir bugfixes y sistema de críticos
- No incluir dist/ ni archivos de test

## PRIORIDAD BAJA

### Cristales psíquicos
- Solo 3 muestras en datos
- Regla avanzada, poco uso

### Familiares
- Datos en familiar_rules.json (dict, no items)
- Regla de nicho
