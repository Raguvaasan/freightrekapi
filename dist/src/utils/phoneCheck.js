"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPhoneGloballyUnique = checkPhoneGloballyUnique;
const adminUser_model_1 = require("../models/admin/adminUser.model");
const staff_model_1 = require("../models/admin/staff.model");
const agency_model_1 = require("../models/admin/agency.model");
const hub_model_1 = require("../models/hub/hub.model");
/**
 * Check if a phone number is already registered across all user types.
 * @param phone - The phone number to check (string)
 * @param exclude - Optional: skip a specific record { model, id }
 * @returns null if phone is available, or an error message string
 */
async function checkPhoneGloballyUnique(phone, exclude) {
    const phoneStr = phone.toString().trim();
    const [admin, staff, agency, hub] = await Promise.all([
        exclude?.model === 'AdminUser'
            ? adminUser_model_1.AdminUser.findOne({ phoneNo: phoneStr, _id: { $ne: exclude.id } }).lean()
            : adminUser_model_1.AdminUser.findOne({ phoneNo: phoneStr }).lean(),
        exclude?.model === 'Staff'
            ? staff_model_1.Staff.findOne({ phone: phoneStr, _id: { $ne: exclude.id } }).lean()
            : staff_model_1.Staff.findOne({ phone: phoneStr }).lean(),
        exclude?.model === 'Agency'
            ? agency_model_1.Agency.findOne({ phone: phoneStr, _id: { $ne: exclude.id } }).lean()
            : agency_model_1.Agency.findOne({ phone: phoneStr }).lean(),
        exclude?.model === 'Hub'
            ? hub_model_1.HubModel.findOne({ phoneNo: Number(phoneStr), _id: { $ne: exclude.id } }).lean()
            : hub_model_1.HubModel.findOne({ phoneNo: Number(phoneStr) }).lean(),
    ]);
    if (admin || staff || agency || hub) {
        return 'This phone number is already registered in the system and cannot be used again.';
    }
    return null;
}
