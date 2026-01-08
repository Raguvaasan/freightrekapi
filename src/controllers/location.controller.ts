import { Request, Response } from 'express';
import { locationService } from '../services/location.service';

// Get all countries
export const getCountries = async (req: Request, res: Response) => {
  try {
    const result = await locationService.getAllCountries();

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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get states by country
export const getStates = async (req: Request, res: Response) => {
  try {
    const { countryId } = req.query;

    if (!countryId || typeof countryId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Country ID is required'
      });
    }

    const result = await locationService.getStatesByCountry(countryId);

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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get cities by state
export const getCities = async (req: Request, res: Response) => {
  try {
    const { stateId } = req.query;

    if (!stateId || typeof stateId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'State ID is required'
      });
    }

    const result = await locationService.getCitiesByState(stateId);

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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Create country (admin only)
export const createCountry = async (req: Request, res: Response) => {
  try {
    const result = await locationService.createCountry(req.body);

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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Create state (admin only)
export const createState = async (req: Request, res: Response) => {
  try {
    const result = await locationService.createState(req.body);

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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Create city (admin only)
export const createCity = async (req: Request, res: Response) => {
  try {
    const result = await locationService.createCity(req.body);

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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
