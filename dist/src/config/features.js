"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isModuleHidden = exports.visibleModules = exports.COLLECTION_AGENCY_ENABLED = exports.HIDDEN_MODULES = void 0;
const adminModule_1 = require("./adminModule");
/**
 * Modules hidden from the product.
 *
 * A hidden module is dropped from GET /admin/role/modules (so it disappears
 * from menus and role/permission screens) and its endpoints answer 410 Gone.
 * Nothing is deleted — set the matching env var to bring it back.
 */
exports.HIDDEN_MODULES = [];
/**
 * Collection Agency is hidden. Set COLLECTION_AGENCY_ENABLED=true to re-enable
 * its endpoints; existing records and code are untouched either way.
 */
exports.COLLECTION_AGENCY_ENABLED = process.env.COLLECTION_AGENCY_ENABLED === 'true';
if (!exports.COLLECTION_AGENCY_ENABLED) {
    exports.HIDDEN_MODULES.push(adminModule_1.adminModule.collection_agency_management);
}
/** Modules the UI should offer, in menu order. */
const visibleModules = () => Object.values(adminModule_1.adminModule).filter((module) => !exports.HIDDEN_MODULES.includes(module));
exports.visibleModules = visibleModules;
const isModuleHidden = (module) => exports.HIDDEN_MODULES.includes(module);
exports.isModuleHidden = isModuleHidden;
