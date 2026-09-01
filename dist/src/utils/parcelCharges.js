"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.effectiveCommissionPercentage = exports.calculateCharges = void 0;
const walletLedger_1 = require("./walletLedger");
const agency_model_1 = require("../models/admin/agency.model");
/**
 * Build the charge breakdown for a booking.
 *
 * Loading and miscellaneous charges are derived from the transportation charge
 * using the agency's percentages (10% each by default):
 *
 *   transport 100 -> loading 10 + miscellaneous 10 -> total 120
 *
 * A caller may override either derived amount (for a discount or a special
 * case); the total always follows the amounts actually used.
 */
const calculateCharges = (transportationCharge, agency, overrides) => {
    const base = (0, walletLedger_1.round2)(Math.max(Number(transportationCharge) || 0, 0));
    const loadingChargePercentage = clampPercentage(agency?.loadingChargePercentage ?? agency_model_1.DEFAULT_LOADING_CHARGE_PERCENTAGE);
    const miscChargePercentage = clampPercentage(agency?.miscChargePercentage ?? agency_model_1.DEFAULT_MISC_CHARGE_PERCENTAGE);
    const loadingCharge = overrides?.loadingCharge !== undefined && overrides.loadingCharge !== null
        ? (0, walletLedger_1.round2)(Math.max(Number(overrides.loadingCharge) || 0, 0))
        : (0, walletLedger_1.round2)((base * loadingChargePercentage) / 100);
    const miscellaneousCharge = overrides?.miscellaneousCharge !== undefined && overrides.miscellaneousCharge !== null
        ? (0, walletLedger_1.round2)(Math.max(Number(overrides.miscellaneousCharge) || 0, 0))
        : (0, walletLedger_1.round2)((base * miscChargePercentage) / 100);
    return {
        transportationCharge: base,
        loadingChargePercentage,
        loadingCharge,
        miscChargePercentage,
        miscellaneousCharge,
        totalAmount: (0, walletLedger_1.round2)(base + loadingCharge + miscellaneousCharge),
    };
};
exports.calculateCharges = calculateCharges;
const clampPercentage = (value) => Math.min(Math.max(Number(value) || 0, 0), 100);
/**
 * Commission the agency actually keeps.
 *
 * Only a third-party agency earns commission — an "Own" agency is company-run,
 * so the entire booking total is remitted to the admin.
 */
const effectiveCommissionPercentage = (agency) => {
    if (!agency)
        return 0;
    if (agency.type === 'Own')
        return 0;
    return clampPercentage(agency.profitPercentage ?? 0);
};
exports.effectiveCommissionPercentage = effectiveCommissionPercentage;
