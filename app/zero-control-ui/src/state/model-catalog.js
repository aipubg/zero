/**
 * Ephemeral in-app state shared by the Models page and the native surface
 * observer. Browser storage is deliberately not used: provider/model state is
 * Gateway-owned, and a page reload must never resurrect a stale local copy.
 */

let modelCatalogDirty = false;

export function markModelCatalogDirty() {
  modelCatalogDirty = true;
}

export function consumeModelCatalogDirty() {
  const dirty = modelCatalogDirty;
  modelCatalogDirty = false;
  return dirty;
}
