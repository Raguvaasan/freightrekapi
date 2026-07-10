import * as yup from 'yup';

// OTP Login - Send OTP
export const collectionAgencySendOtpSchema = yup.object({
  body: yup.object({
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
      .trim(),
    countryCode: yup
      .string()
      .required('Country code is required')
      .trim(),
  }),
});

// OTP Login - Verify OTP
export const collectionAgencyVerifyOtpSchema = yup.object({
  body: yup.object({
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
      .trim(),
    countryCode: yup
      .string()
      .required('Country code is required')
      .trim(),
    otp: yup
      .string()
      .required('OTP is required')
      .matches(/^[0-9]{6}$/, 'OTP must be 6 digits'),
  }),
});

// Create collection agency validation schema
export const createCollectionAgencySchema = yup.object({
  body: yup.object({
    collectionAgencyName: yup
      .string()
      .required('Collection agency name is required')
      .min(2, 'Collection agency name must be at least 2 characters')
      .max(100, 'Collection agency name must not exceed 100 characters')
      .trim(),
    ownerName: yup
      .string()
      .required('Owner name is required')
      .min(2, 'Owner name must be at least 2 characters')
      .max(100, 'Owner name must not exceed 100 characters')
      .trim(),
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
      .trim(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
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
      .matches(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits')
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

// Update collection agency validation schema
export const updateCollectionAgencySchema = yup.object({
  body: yup.object({
    collectionAgencyName: yup
      .string()
      .min(2, 'Collection agency name must be at least 2 characters')
      .max(100, 'Collection agency name must not exceed 100 characters')
      .trim()
      .optional(),
    ownerName: yup
      .string()
      .min(2, 'Owner name must be at least 2 characters')
      .max(100, 'Owner name must not exceed 100 characters')
      .trim()
      .optional(),
    phone: yup
      .string()
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
      .trim()
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
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
      .matches(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits')
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
      .required('Collection agency ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid collection agency ID'),
  }),
});

// Get collection agency by ID validation schema
export const getCollectionAgencyByIdSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Collection agency ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid collection agency ID'),
  }),
});

// Delete collection agency validation schema
export const deleteCollectionAgencySchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Collection agency ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid collection agency ID'),
  }),
});

// Update collection agency status validation schema
export const updateCollectionAgencyStatusSchema = yup.object({
  body: yup.object({
    status: yup
      .string()
      .required('Status is required')
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Collection agency ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid collection agency ID'),
  }),
});
