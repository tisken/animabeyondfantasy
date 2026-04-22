/**
 * @module combat/targeting/placeAreaTemplate
 *
 * Place a MeasuredTemplate on the canvas for area-of-effect spells/powers.
 * Inspired by PF2e's placeRegionFromItem.
 *
 * Usage:
 *   const template = await placeAreaTemplate(area, { origin: token.center });
 *   const targets = resolveAreaTargets(area, template.position);
 */

/**
 * Place a measured template on the canvas and wait for the user to position it.
 *
 * @param {import('../../data/area').EffectArea} area - The area definition
 * @param {object} options
 * @param {string} [options.texture] - Optional texture path for the template
 * @param {{x: number, y: number}} [options.origin] - Starting position
 * @returns {Promise<{position: {x: number, y: number}, template: any} | null>}
 */
export async function placeAreaTemplate(area, options = {}) {
  if (!canvas?.ready) return null;

  const distPixels = canvas.dimensions?.distancePixels ?? 1;
  const distance = area.value ?? 0;

  const templateData = {
    t: mapAreaTypeToTemplate(area.type),
    distance,
    width: area.type === 'ray' ? (area.width ?? 1) : 0,
    direction: 0,
    x: options.origin?.x ?? 0,
    y: options.origin?.y ?? 0,
    fillColor: game.user?.color ?? '#000000',
    texture: options.texture ?? ''
  };

  // Angle for cones
  if (area.type === 'cone') {
    templateData.angle = 90;
  }

  const MeasuredTemplateDoc = CONFIG.MeasuredTemplate.documentClass;
  const doc = new MeasuredTemplateDoc(templateData, { parent: canvas.scene });
  const template = new CONFIG.MeasuredTemplate.objectClass(doc);

  // Let user place it interactively
  return new Promise(resolve => {
    template.draw();
    template.layer.activate();
    template.layer.preview.addChild(template);

    const moveHandler = event => {
      const pos = event.data?.getLocalPosition?.(canvas.app.stage) ??
                  event.getLocalPosition?.(canvas.app.stage) ??
                  { x: 0, y: 0 };
      const snapped = canvas.grid.getSnappedPoint(pos, { mode: CONST.GRID_SNAPPING_MODES.CENTER });
      template.document.updateSource({ x: snapped.x, y: snapped.y });
      template.refresh();
    };

    const confirmHandler = async () => {
      cleanup();
      const position = { x: template.document.x, y: template.document.y };

      // Create the actual template on the scene
      const [created] = await canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [
        template.document.toObject()
      ]);

      resolve({ position, template: created });
    };

    const cancelHandler = () => {
      cleanup();
      resolve(null);
    };

    const cleanup = () => {
      template.layer.preview.removeChild(template);
      canvas.stage.off('pointermove', moveHandler);
      canvas.stage.off('pointerdown', confirmHandler);
      canvas.app.view.removeEventListener('contextmenu', cancelHandler);
    };

    canvas.stage.on('pointermove', moveHandler);
    canvas.stage.on('pointerdown', confirmHandler);
    canvas.app.view.addEventListener('contextmenu', cancelHandler, { once: true });
  });
}

/**
 * Map our area type to Foundry's MeasuredTemplate type.
 */
function mapAreaTypeToTemplate(areaType) {
  switch (areaType) {
    case 'circle': return 'circle';
    case 'cone': return 'cone';
    case 'rect': return 'rect';
    case 'ray': return 'ray';
    default: return 'circle';
  }
}

/**
 * Remove a placed template from the scene.
 * @param {string} templateId
 */
export async function removeAreaTemplate(templateId) {
  if (!templateId || !canvas?.scene) return;
  await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [templateId]);
}
