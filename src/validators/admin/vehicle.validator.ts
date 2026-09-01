import * as yup from 'yup';

const objectId = /^[0-9a-fA-F]{24}$/;

// Create vehicle validation schema
export const createVehicleSchema = yup.object({
  body: yup.object({
    vehicleType: yup
      .string()
      .required('Vehicle type is required')
      .min(2, 'Vehicle type must be at least 2 characters')
      .max(100, 'Vehicle type must not exceed 100 characters')
      .trim(),
    capacity: yup
      .string()
      .required('Capacity is required')
      .max(50, 'Capacity must not exceed 50 characters')
      .trim(),
    vehicleRegistrationNumber: yup
      .string()
      .required('Vehicle registration number is required')
      .min(4, 'Vehicle registration number must be at least 4 characters')
      .max(20, 'Vehicle registration number must not exceed 20 characters')
      .trim(),
    rcNumber: yup
      .string()
      .required('RC number is required')
      .max(50, 'RC number must not exceed 50 characters')
      .trim(),
    insuranceNumber: yup
      .string()
      .required('Insurance number is required')
      .max(50, 'Insurance number must not exceed 50 characters')
      .trim(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
  }),
});

// Update vehicle validation schema
export const updateVehicleSchema = yup.object({
  body: yup.object({
    vehicleType: yup
      .string()
      .min(2, 'Vehicle type must be at least 2 characters')
      .max(100, 'Vehicle type must not exceed 100 characters')
      .trim()
      .optional(),
    capacity: yup
      .string()
      .max(50, 'Capacity must not exceed 50 characters')
      .trim()
      .optional(),
    vehicleRegistrationNumber: yup
      .string()
      .min(4, 'Vehicle registration number must be at least 4 characters')
      .max(20, 'Vehicle registration number must not exceed 20 characters')
      .trim()
      .optional(),
    rcNumber: yup
      .string()
      .max(50, 'RC number must not exceed 50 characters')
      .trim()
      .optional(),
    insuranceNumber: yup
      .string()
      .max(50, 'Insurance number must not exceed 50 characters')
      .trim()
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Vehicle ID is required')
      .matches(objectId, 'Invalid vehicle ID'),
  }),
});

// Update vehicle status validation schema
export const updateVehicleStatusSchema = yup.object({
  body: yup.object({
    status: yup
      .string()
      .required('Status is required')
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Vehicle ID is required')
      .matches(objectId, 'Invalid vehicle ID'),
  }),
});

// Get vehicle by ID validation schema
export const getVehicleByIdSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Vehicle ID is required')
      .matches(objectId, 'Invalid vehicle ID'),
  }),
});

// Delete vehicle validation schema
export const deleteVehicleSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Vehicle ID is required')
      .matches(objectId, 'Invalid vehicle ID'),
  }),
});
