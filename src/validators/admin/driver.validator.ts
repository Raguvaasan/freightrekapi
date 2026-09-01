import * as yup from 'yup';

const objectId = /^[0-9a-fA-F]{24}$/;

// Create driver validation schema
export const createDriverSchema = yup.object({
  body: yup.object({
    driverName: yup
      .string()
      .required('Driver name is required')
      .min(2, 'Driver name must be at least 2 characters')
      .max(100, 'Driver name must not exceed 100 characters')
      .trim(),
    phoneNumber: yup
      .string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
      .trim(),
    licenseNumber: yup
      .string()
      .required('License number is required')
      .min(4, 'License number must be at least 4 characters')
      .max(30, 'License number must not exceed 30 characters')
      .trim(),
    dateOfExpiry: yup
      .date()
      .typeError('Date of expiry must be a valid date')
      .required('Date of expiry is required'),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
  }),
});

// Update driver validation schema
export const updateDriverSchema = yup.object({
  body: yup.object({
    driverName: yup
      .string()
      .min(2, 'Driver name must be at least 2 characters')
      .max(100, 'Driver name must not exceed 100 characters')
      .trim()
      .optional(),
    phoneNumber: yup
      .string()
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
      .trim()
      .optional(),
    licenseNumber: yup
      .string()
      .min(4, 'License number must be at least 4 characters')
      .max(30, 'License number must not exceed 30 characters')
      .trim()
      .optional(),
    dateOfExpiry: yup
      .date()
      .typeError('Date of expiry must be a valid date')
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Driver ID is required')
      .matches(objectId, 'Invalid driver ID'),
  }),
});

// Update driver status validation schema
export const updateDriverStatusSchema = yup.object({
  body: yup.object({
    status: yup
      .string()
      .required('Status is required')
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Driver ID is required')
      .matches(objectId, 'Invalid driver ID'),
  }),
});

// Get driver by ID validation schema
export const getDriverByIdSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Driver ID is required')
      .matches(objectId, 'Invalid driver ID'),
  }),
});

// Delete driver validation schema
export const deleteDriverSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Driver ID is required')
      .matches(objectId, 'Invalid driver ID'),
  }),
});
