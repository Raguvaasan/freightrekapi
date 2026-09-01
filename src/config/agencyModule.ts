/**
 * Modules an agency (franchise) role can be given permissions on.
 *
 * Agency roles (FranchiseRole) store the module as free text, so this is the
 * canonical list the role screen offers and the agency routes check against —
 * a permission row whose module is not one of these matches no route.
 */
export const agencyModule = {
  dashboard: "Dashboard",
  parcel_management: "Parcel Management",
  invoice_management: "Invoice Management",
  wallet_management: "Wallet Management",
  payout_management: "Payout Management",
  customer_management: "Customer Management",
  staff_management: "Staff Management",
  access_management: "Access Management",
};

/** Modules the agency role screen should offer, in menu order. */
export const agencyModules = (): string[] => Object.values(agencyModule);

/**
 * Module names the agency role screen used before this list was fixed, as
 * found on the roles already in the database. A role written against the old
 * free-text screen keeps working; new roles should use the names above.
 *
 * There is deliberately no alias for Invoice Management — invoices were not a
 * permission of their own before, so it has to be granted explicitly.
 */
const LEGACY_NAMES: Record<string, string[]> = {
  [agencyModule.parcel_management]: ['Orders'],
  [agencyModule.wallet_management]: ['Wallet'],
  [agencyModule.staff_management]: ['Manage Staffs'],
  [agencyModule.access_management]: ['Role & Permissions'],
};

/** Every name that grants a module: the canonical one plus its old spellings. */
export const agencyPermission = (module: string): string[] => [
  module,
  ...(LEGACY_NAMES[module] || []),
];
