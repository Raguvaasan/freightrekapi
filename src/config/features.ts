import { adminModule } from './adminModule';

/**
 * Modules hidden from the product.
 *
 * A hidden module is dropped from GET /admin/role/modules (so it disappears
 * from menus and role/permission screens) and its endpoints answer 410 Gone.
 * Nothing is deleted — set the matching env var to bring it back.
 */
export const HIDDEN_MODULES: string[] = [];

/**
 * Collection Agency is hidden. Set COLLECTION_AGENCY_ENABLED=true to re-enable
 * its endpoints; existing records and code are untouched either way.
 */
export const COLLECTION_AGENCY_ENABLED =
  process.env.COLLECTION_AGENCY_ENABLED === 'true';

if (!COLLECTION_AGENCY_ENABLED) {
  HIDDEN_MODULES.push(adminModule.collection_agency_management);
}

/** Modules the UI should offer, in menu order. */
export const visibleModules = (): string[] =>
  Object.values(adminModule).filter((module) => !HIDDEN_MODULES.includes(module));

export const isModuleHidden = (module: string): boolean =>
  HIDDEN_MODULES.includes(module);
