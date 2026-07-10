import * as yup from 'yup';

// Create collection agency staff validation schema
// (type & collectionAgencyId are injected by the controller from the logged-in agency)
export const createCollectionAgencyStaffSchema = yup.object({
  body: yup.object({
    name: yup
      .string()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .trim(),
    email: yup
      .string()
      .required('Email is required')
      .email('Invalid email format')
      .max(100, 'Email must not exceed 100 characters')
      .trim(),
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
      .trim(),
    roleId: yup
      .string()
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID')
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
    username: yup
      .string()
      .required('Username is required')
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must not exceed 50 characters')
      .trim(),
    password: yup
      .string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must not exceed 100 characters'),
  }),
});

// Update collection agency staff validation schema
export const updateCollectionAgencyStaffSchema = yup.object({
  body: yup.object({
    name: yup
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .trim()
      .optional(),
    email: yup
      .string()
      .email('Invalid email format')
      .max(100, 'Email must not exceed 100 characters')
      .trim()
      .optional(),
    phone: yup
      .string()
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
      .trim()
      .optional(),
    roleId: yup
      .string()
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID')
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
    username: yup
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must not exceed 50 characters')
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
      .required('Staff ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
  }),
});
