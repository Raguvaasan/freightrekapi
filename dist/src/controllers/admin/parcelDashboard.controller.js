"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHubParcelDashboard = exports.getAgencyDashboard = void 0;
const parcelDashboard_service_1 = require("../../services/admin/parcelDashboard.service");
const parcelActor_1 = require("../../utils/parcelActor");
const getActor = async (req, res) => {
    if (req.parcelActor)
        return req.parcelActor;
    const actor = await (0, parcelActor_1.resolveParcelActor)(req.user?.id);
    if (!actor) {
        res.status(403).json({
            success: false,
            message: 'Account is not allowed to access the parcel flow (or is inactive)',
        });
        return null;
    }
    return actor;
};
const fail = (res, result, fallback = 400) => res.status(result.code || fallback).json({
    success: false,
    message: result.message,
});
/**
 * An agency's own dashboard. Always scoped to the logged-in agency, so no
 * agency id is accepted — an admin comparing agencies uses /admin/dashboard.
 */
const getAgencyDashboard = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelDashboard_service_1.parcelDashboardService.getAgencyDashboard(actor.agencyId);
        if (!result.success)
            return fail(res, result);
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getAgencyDashboard = getAgencyDashboard;
/** A hub's own dashboard, scoped to the logged-in hub */
const getHubParcelDashboard = async (req, res) => {
    try {
        const actor = await getActor(req, res);
        if (!actor)
            return;
        const result = await parcelDashboard_service_1.parcelDashboardService.getHubDashboard(actor.hubId);
        if (!result.success)
            return fail(res, result);
        return res.status(200).json({ success: true, data: result.data });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error',
        });
    }
};
exports.getHubParcelDashboard = getHubParcelDashboard;
