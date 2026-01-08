"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCity = exports.createState = exports.createCountry = exports.getCities = exports.getStates = exports.getCountries = void 0;
const location_service_1 = require("../services/location.service");
// Get all countries
const getCountries = async (req, res) => {
    try {
        const result = await location_service_1.locationService.getAllCountries();
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getCountries = getCountries;
// Get states by country
const getStates = async (req, res) => {
    try {
        const { countryId } = req.query;
        if (!countryId || typeof countryId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Country ID is required'
            });
        }
        const result = await location_service_1.locationService.getStatesByCountry(countryId);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getStates = getStates;
// Get cities by state
const getCities = async (req, res) => {
    try {
        const { stateId } = req.query;
        if (!stateId || typeof stateId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'State ID is required'
            });
        }
        const result = await location_service_1.locationService.getCitiesByState(stateId);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getCities = getCities;
// Create country (admin only)
const createCountry = async (req, res) => {
    try {
        const result = await location_service_1.locationService.createCountry(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        return res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.createCountry = createCountry;
// Create state (admin only)
const createState = async (req, res) => {
    try {
        const result = await location_service_1.locationService.createState(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        return res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.createState = createState;
// Create city (admin only)
const createCity = async (req, res) => {
    try {
        const result = await location_service_1.locationService.createCity(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        return res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.createCity = createCity;
