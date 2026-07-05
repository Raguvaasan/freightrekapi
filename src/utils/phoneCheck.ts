import { AdminUser } from '../models/admin/adminUser.model';
import { Staff } from '../models/admin/staff.model';
import { Agency } from '../models/admin/agency.model';
import { CollectionAgency } from '../models/admin/collectionAgency.model';
import { HubModel } from '../models/hub/hub.model';

/**
 * Check if a phone number is already registered across all user types.
 * @param phone - The phone number to check (string)
 * @param exclude - Optional: skip a specific record { model, id }
 * @returns null if phone is available, or an error message string
 */
export async function checkPhoneGloballyUnique(
  phone: string,
  exclude?: { model: 'AdminUser' | 'Staff' | 'Agency' | 'CollectionAgency' | 'Hub'; id: string }
): Promise<string | null> {
  const phoneStr = phone.toString().trim();

  const [admin, staff, agency, collectionAgency, hub] = await Promise.all([
    exclude?.model === 'AdminUser'
      ? AdminUser.findOne({ phoneNo: phoneStr, _id: { $ne: exclude.id } }).lean()
      : AdminUser.findOne({ phoneNo: phoneStr }).lean(),
    exclude?.model === 'Staff'
      ? Staff.findOne({ phone: phoneStr, _id: { $ne: exclude.id } }).lean()
      : Staff.findOne({ phone: phoneStr }).lean(),
    exclude?.model === 'Agency'
      ? Agency.findOne({ phone: phoneStr, _id: { $ne: exclude.id } }).lean()
      : Agency.findOne({ phone: phoneStr }).lean(),
    exclude?.model === 'CollectionAgency'
      ? CollectionAgency.findOne({ phone: phoneStr, _id: { $ne: exclude.id } }).lean()
      : CollectionAgency.findOne({ phone: phoneStr }).lean(),
    exclude?.model === 'Hub'
      ? HubModel.findOne({ phoneNo: Number(phoneStr), _id: { $ne: exclude.id } }).lean()
      : HubModel.findOne({ phoneNo: Number(phoneStr) }).lean(),
  ]);

  if (admin || staff || agency || collectionAgency || hub) {
    return 'This phone number is already registered in the system and cannot be used again.';
  }

  return null;
}
