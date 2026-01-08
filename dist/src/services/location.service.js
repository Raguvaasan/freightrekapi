"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationService = void 0;
const country_model_1 = require("../models/location/country.model");
const state_model_1 = require("../models/location/state.model");
const city_model_1 = require("../models/location/city.model");
const mongoose_1 = require("mongoose");
exports.locationService = {
    // Get all active countries
    getAllCountries: async () => {
        try {
            const countries = await country_model_1.Country.find({ isActive: true })
                .select('name code')
                .sort({ name: 1 });
            return {
                success: true,
                data: countries
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Get states by country ID
    getStatesByCountry: async (countryId) => {
        try {
            // Validate country ID
            if (!mongoose_1.Types.ObjectId.isValid(countryId)) {
                return {
                    success: false,
                    message: 'Invalid country ID'
                };
            }
            // Check if country exists
            const country = await country_model_1.Country.findById(countryId);
            if (!country) {
                return {
                    success: false,
                    message: 'Country not found'
                };
            }
            // Get states for the country
            const states = await state_model_1.State.find({
                countryId: new mongoose_1.Types.ObjectId(countryId),
                isActive: true
            })
                .select('name code countryId')
                .populate('countryId', 'name code')
                .sort({ name: 1 });
            return {
                success: true,
                data: states
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Get cities by state ID
    getCitiesByState: async (stateId) => {
        try {
            // Validate state ID
            if (!mongoose_1.Types.ObjectId.isValid(stateId)) {
                return {
                    success: false,
                    message: 'Invalid state ID'
                };
            }
            // Check if state exists
            const state = await state_model_1.State.findById(stateId);
            if (!state) {
                return {
                    success: false,
                    message: 'State not found'
                };
            }
            // Get cities for the state
            const cities = await city_model_1.City.find({
                stateId: new mongoose_1.Types.ObjectId(stateId),
                isActive: true
            })
                .select('name stateId pincode')
                .populate('stateId', 'name code')
                .sort({ name: 1 });
            return {
                success: true,
                data: cities
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Create country (admin only)
    createCountry: async (data) => {
        try {
            const country = new country_model_1.Country(data);
            await country.save();
            return {
                success: true,
                message: 'Country created successfully',
                data: country
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Create state (admin only)
    createState: async (data) => {
        try {
            // Validate country ID
            if (!mongoose_1.Types.ObjectId.isValid(data.countryId)) {
                return {
                    success: false,
                    message: 'Invalid country ID'
                };
            }
            // Check if country exists
            const country = await country_model_1.Country.findById(data.countryId);
            if (!country) {
                return {
                    success: false,
                    message: 'Country not found'
                };
            }
            const state = new state_model_1.State(data);
            await state.save();
            return {
                success: true,
                message: 'State created successfully',
                data: state
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    },
    // Create city (admin only)
    createCity: async (data) => {
        try {
            // Validate state ID
            if (!mongoose_1.Types.ObjectId.isValid(data.stateId)) {
                return {
                    success: false,
                    message: 'Invalid state ID'
                };
            }
            // Check if state exists
            const state = await state_model_1.State.findById(data.stateId);
            if (!state) {
                return {
                    success: false,
                    message: 'State not found'
                };
            }
            const city = new city_model_1.City(data);
            await city.save();
            return {
                success: true,
                message: 'City created successfully',
                data: city
            };
        }
        catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    }
};
