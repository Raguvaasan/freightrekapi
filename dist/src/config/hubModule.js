"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hubPermission = exports.hubModules = exports.hubModule = void 0;
/**
 * Modules a hub role can be given permissions on.
 *
 * Hub roles (HubRole) store the module as free text, so this is the canonical
 * list the role screen offers and the hub routes check against — a permission
 * row whose module is not one of these matches no route.
 */
exports.hubModule = {
    dashboard: "Dashboard",
    parcel_management: "Parcel Management",
    invoice_management: "Invoice Management",
    staff_management: "Staff Management",
    access_management: "Access Management",
};
/** Modules the hub role screen should offer, in menu order. */
const hubModules = () => Object.values(exports.hubModule);
exports.hubModules = hubModules;
/**
 * Module names the hub role screen used before this list was fixed, as found
 * on the roles already in the database. A role written against the old
 * free-text screen keeps working; new roles should use the names above.
 *
 * There is deliberately no alias for Invoice Management — a hub had no invoice
 * access at all before, so it has to be granted explicitly.
 */
const LEGACY_NAMES = {
    [exports.hubModule.parcel_management]: ['Orders'],
};
/** Every name that grants a module: the canonical one plus its old spellings. */
const hubPermission = (module) => [
    module,
    ...(LEGACY_NAMES[module] || []),
];
exports.hubPermission = hubPermission;
