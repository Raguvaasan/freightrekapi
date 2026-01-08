import { Country } from '../models/location/country.model';
import { State } from '../models/location/state.model';
import { City } from '../models/location/city.model';
import { Types } from 'mongoose';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const locationService = {
  // Get all active countries
  getAllCountries: async (): Promise<ServiceResponse> => {
    try {
      const countries = await Country.find({ isActive: true })
        .select('name code')
        .sort({ name: 1 });

      return {
        success: true,
        data: countries
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Get states by country ID
  getStatesByCountry: async (countryId: string): Promise<ServiceResponse> => {
    try {
      // Validate country ID
      if (!Types.ObjectId.isValid(countryId)) {
        return {
          success: false,
          message: 'Invalid country ID'
        };
      }

      // Check if country exists
      const country = await Country.findById(countryId);
      if (!country) {
        return {
          success: false,
          message: 'Country not found'
        };
      }

      // Get states for the country
      const states = await State.find({ 
        countryId: new Types.ObjectId(countryId),
        isActive: true 
      })
        .select('name code countryId')
        .populate('countryId', 'name code')
        .sort({ name: 1 });

      return {
        success: true,
        data: states
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Get cities by state ID
  getCitiesByState: async (stateId: string): Promise<ServiceResponse> => {
    try {
      // Validate state ID
      if (!Types.ObjectId.isValid(stateId)) {
        return {
          success: false,
          message: 'Invalid state ID'
        };
      }

      // Check if state exists
      const state = await State.findById(stateId);
      if (!state) {
        return {
          success: false,
          message: 'State not found'
        };
      }

      // Get cities for the state
      const cities = await City.find({ 
        stateId: new Types.ObjectId(stateId),
        isActive: true 
      })
        .select('name stateId pincode')
        .populate('stateId', 'name code')
        .sort({ name: 1 });

      return {
        success: true,
        data: cities
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Create country (admin only)
  createCountry: async (data: { name: string; code: string }): Promise<ServiceResponse> => {
    try {
      const country = new Country(data);
      await country.save();

      return {
        success: true,
        message: 'Country created successfully',
        data: country
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Create state (admin only)
  createState: async (data: { name: string; countryId: string; code: string }): Promise<ServiceResponse> => {
    try {
      // Validate country ID
      if (!Types.ObjectId.isValid(data.countryId)) {
        return {
          success: false,
          message: 'Invalid country ID'
        };
      }

      // Check if country exists
      const country = await Country.findById(data.countryId);
      if (!country) {
        return {
          success: false,
          message: 'Country not found'
        };
      }

      const state = new State(data);
      await state.save();

      return {
        success: true,
        message: 'State created successfully',
        data: state
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  // Create city (admin only)
  createCity: async (data: { name: string; stateId: string; pincode?: string }): Promise<ServiceResponse> => {
    try {
      // Validate state ID
      if (!Types.ObjectId.isValid(data.stateId)) {
        return {
          success: false,
          message: 'Invalid state ID'
        };
      }

      // Check if state exists
      const state = await State.findById(data.stateId);
      if (!state) {
        return {
          success: false,
          message: 'State not found'
        };
      }

      const city = new City(data);
      await city.save();

      return {
        success: true,
        message: 'City created successfully',
        data: city
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message
      };
    }
  }
};
