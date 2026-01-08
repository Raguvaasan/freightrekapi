import * as yup from 'yup';

// Franchise login validation schema
export const franchiseLoginSchema = yup.object({
  body: yup.object({
    username: yup
      .string()
      .required('Username is required')
      .email('Username must be a valid email')
      .trim(),
    password: yup
      .string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
  }),
});

// Create agency validation schema
export const createAgencySchema = yup.object({
  body: yup.object({
    agencyName: yup
      .string()
      .required('Agency name is required')
      .min(2, 'Agency name must be at least 2 characters')
      .max(100, 'Agency name must not exceed 100 characters')
      .trim(),
    agencyOwner: yup
      .string()
      .required('Agency owner is required')
      .min(2, 'Agency owner name must be at least 2 characters')
      .max(100, 'Agency owner name must not exceed 100 characters')
      .trim(),
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(
        /^[0-9]{10}$/,
        'Phone number must be exactly 10 digits'
      )
      .trim(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
    agencyType: yup
      .string()
      .max(50, 'Agency type must not exceed 50 characters')
      .trim()
      .optional(),
    email: yup
      .string()
      .email('Invalid email format')
      .max(100, 'Email must not exceed 100 characters')
      .trim()
      .optional(),
    address: yup
      .string()
      .max(500, 'Address must not exceed 500 characters')
      .trim()
      .optional(),
    city: yup
      .string()
      .max(100, 'City must not exceed 100 characters')
      .trim()
      .optional(),
    state: yup
      .string()
      .max(100, 'State must not exceed 100 characters')
      .trim()
      .optional(),
    pincode: yup
      .string()
      .matches(
        /^[0-9]{6}$/,
        'Pincode must be exactly 6 digits'
      )
      .trim()
      .optional(),
    gstNumber: yup
      .string()
      .matches(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Invalid GST number format'
      )
      .trim()
      .optional(),
    username: yup
      .string()
      .email('Username must be a valid email')
      .max(100, 'Username must not exceed 100 characters')
      .trim()
      .optional(),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must not exceed 100 characters')
      .optional(),
  }),
});

// Update agency validation schema
export const updateAgencySchema = yup.object({
  body: yup.object({
    agencyName: yup
      .string()
      .min(2, 'Agency name must be at least 2 characters')
      .max(100, 'Agency name must not exceed 100 characters')
      .trim()
      .optional(),
    agencyOwner: yup
      .string()
      .min(2, 'Agency owner name must be at least 2 characters')
      .max(100, 'Agency owner name must not exceed 100 characters')
      .trim()
      .optional(),
    phone: yup
      .string()
      .matches(
        /^[0-9]{10}$/,
        'Phone number must be exactly 10 digits'
      )
      .trim()
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
    agencyType: yup
      .string()
      .max(50, 'Agency type must not exceed 50 characters')
      .trim()
      .optional(),
    email: yup
      .string()
      .email('Invalid email format')
      .max(100, 'Email must not exceed 100 characters')
      .trim()
      .optional(),
    address: yup
      .string()
      .max(500, 'Address must not exceed 500 characters')
      .trim()
      .optional(),
    city: yup
      .string()
      .max(100, 'City must not exceed 100 characters')
      .trim()
      .optional(),
    state: yup
      .string()
      .max(100, 'State must not exceed 100 characters')
      .trim()
      .optional(),
    pincode: yup
      .string()
      .matches(
        /^[0-9]{6}$/,
        'Pincode must be exactly 6 digits'
      )
      .trim()
      .optional(),
    gstNumber: yup
      .string()
      .matches(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Invalid GST number format'
      )
      .trim()
      .optional(),
    username: yup
      .string()
      .email('Username must be a valid email')
      .max(100, 'Username must not exceed 100 characters')
      .trim()
      .optional(),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must not exceed 100 characters')
      .optional(),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Agency ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid agency ID'),
  }),
});

// Update agency status validation schema
export const updateAgencyStatusSchema = yup.object({
  body: yup.object({
    status: yup
      .string()
      .required('Status is required')
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Agency ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid agency ID'),
  }),
});

// Get agency by ID validation schema
export const getAgencyByIdSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Agency ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid agency ID'),
  }),
});

// Delete agency validation schema
export const deleteAgencySchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Agency ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid agency ID'),
  }),
});

// Get agencies by hub validation schema
export const getAgenciesByHubSchema = yup.object({
  params: yup.object({
    hubId: yup
      .string()
      .required('Hub ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid hub ID'),
  }),
});
