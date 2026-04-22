/**
 * Foundry v13+ compatibility helpers.
 *
 * In v13 several globals were namespaced under `foundry.applications.ux`.
 * Accessing the old globals (TextEditor, ContextMenu, etc.) triggers
 * deprecation warnings that will become errors in v15/v16.
 *
 * @see https://foundryvtt.com/kb/
 */

declare const foundry: any;
declare const globalThis: any;

interface ContextMenuItem {
  name: string;
  icon: string;
  callback: (target: HTMLElement) => void;
  condition?: (target: HTMLElement) => boolean;
}

/**
 * Get the TextEditor implementation (v13+ namespaced).
 */
export function getTextEditor(): any {
  return foundry.applications?.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
}

/**
 * Get the ContextMenu implementation (v13+ namespaced).
 */
export function getContextMenu(): any {
  return foundry.applications?.ux?.ContextMenu?.implementation ?? globalThis.ContextMenu;
}

/**
 * Whether the current Foundry version uses the v13+ namespaced APIs.
 */
export function isV13Plus(): boolean {
  return !!foundry.applications?.ux?.TextEditor?.implementation;
}

/**
 * Enrich HTML text using the correct TextEditor for the running version.
 * Drop-in replacement for `TextEditor.enrichHTML(...)`.
 */
export async function enrichHTML(content: string, options: Record<string, unknown> = {}): Promise<string> {
  const TE = getTextEditor();
  return TE.enrichHTML(content, { async: true, ...options });
}

/**
 * Create a ContextMenu compatible with v13+.
 * Automatically passes `jQuery: false` on v13+ to avoid the jQuery
 * transact deprecation warning.
 */
export function createContextMenu(
  element: HTMLElement | { [0]?: HTMLElement },
  selector: string,
  menuItems: ContextMenuItem[],
  extraOptions: Record<string, unknown> = {}
): any {
  const CM = getContextMenu();
  const el = element instanceof HTMLElement ? element : (element as any)[0] ?? element;

  // On v13+ pass jQuery: false so callbacks receive HTMLElement, not jQuery
  const opts = isV13Plus() ? { jQuery: false, ...extraOptions } : extraOptions;

  return new CM(el, selector, menuItems, opts);
}
