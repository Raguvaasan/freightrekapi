import { round2 } from './walletLedger';
import {
  DEFAULT_LOADING_CHARGE_PERCENTAGE,
  DEFAULT_MISC_CHARGE_PERCENTAGE,
} from '../models/admin/agency.model';

export interface ChargeBreakdown {
  transportationCharge: number;
  loadingChargePercentage: number;
  loadingCharge: number;
  miscChargePercentage: number;
  miscellaneousCharge: number;
  /** What the customer pays: transport + loading + miscellaneous */
  totalAmount: number;
}

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
export const calculateCharges = (
  transportationCharge: number,
  agency?: { loadingChargePercentage?: number; miscChargePercentage?: number },
  overrides?: { loadingCharge?: number; miscellaneousCharge?: number }
): ChargeBreakdown => {
  const base = round2(Math.max(Number(transportationCharge) || 0, 0));

  const loadingChargePercentage = clampPercentage(
    agency?.loadingChargePercentage ?? DEFAULT_LOADING_CHARGE_PERCENTAGE
  );
  const miscChargePercentage = clampPercentage(
    agency?.miscChargePercentage ?? DEFAULT_MISC_CHARGE_PERCENTAGE
  );

  const loadingCharge =
    overrides?.loadingCharge !== undefined && overrides.loadingCharge !== null
      ? round2(Math.max(Number(overrides.loadingCharge) || 0, 0))
      : round2((base * loadingChargePercentage) / 100);

  const miscellaneousCharge =
    overrides?.miscellaneousCharge !== undefined && overrides.miscellaneousCharge !== null
      ? round2(Math.max(Number(overrides.miscellaneousCharge) || 0, 0))
      : round2((base * miscChargePercentage) / 100);

  return {
    transportationCharge: base,
    loadingChargePercentage,
    loadingCharge,
    miscChargePercentage,
    miscellaneousCharge,
    totalAmount: round2(base + loadingCharge + miscellaneousCharge),
  };
};

const clampPercentage = (value: number): number =>
  Math.min(Math.max(Number(value) || 0, 0), 100);

/**
 * Commission the agency actually keeps.
 *
 * Only a third-party agency earns commission — an "Own" agency is company-run,
 * so the entire booking total is remitted to the admin.
 */
export const effectiveCommissionPercentage = (agency?: {
  type?: string;
  profitPercentage?: number;
}): number => {
  if (!agency) return 0;
  if (agency.type === 'Own') return 0;
  return clampPercentage(agency.profitPercentage ?? 0);
};
