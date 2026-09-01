/**
 * Modules a hub role can be given permissions on.
 *
 * Hub roles (HubRole) store the module as free text, so this is the canonical
 * list the role screen offers and the hub routes check against — a permission
 * row whose module is not one of these matches no route.
 */
export const hubModule = {
  dashboard: "Dashboard",
  parcel_management: "Parcel Management",
  invoice_management: "Invoice Management",
  staff_management: "Staff Management",
  access_management: "Access Management",
};

/** Modules the hub role screen should offer, in menu order. */
export const hubModules = (): string[] => Object.values(hubModule);

/**
 * Module names the hub role screen used before this list was fixed, as found
 * on the roles already in the database. A role written against the old
 * free-text screen keeps working; new roles should use the names above.
 *
 * There is deliberately no alias for Invoice Management — a hub had no invoice
 * access at all before, so it has to be granted explicitly.
 */
const LEGACY_NAMES: Record<string, string[]> = {
  [hubModule.parcel_management]: ['Orders'],
};

/** Every name that grants a module: the canonical one plus its old spellings. */
export const hubPermission = (module: string): string[] => [
  module,
  ...(LEGACY_NAMES[module] || []),
];
