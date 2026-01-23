import * as yup from 'yup';

// Create staff validation schema
export const createStaffSchema = yup.object({
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
      .matches(
        /^[0-9]{10}$/,
        'Phone number must be exactly 10 digits'
      )
      .trim(),
    type: yup
      .string()
      .required('Type is required')
      .oneOf(['head_quarter', 'franchise'], 'Type must be either head_quarter or franchise'),
    roleId: yup
      .string()
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID')
      .when('type', {
        is: 'head_quarter',
        then: (schema) => schema.required('Role is required for head quarter staff'),
        otherwise: (schema) => schema.test(
          'no-role-for-franchise',
          'Role should not be provided for franchise staff',
          (value) => !value
        ),
      }),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
    franchiseId: yup
      .string()
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid franchise ID')
      .when('type', {
        is: 'franchise',
        then: (schema) => schema.required('Franchise is required for franchise staff'),
        otherwise: (schema) => schema.test(
          'no-franchise-for-hq',
          'Franchise should not be provided for head quarter staff',
          (value) => !value
        ),
      }),
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

// Update staff validation schema
export const updateStaffSchema = yup.object({
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
      .matches(
        /^[0-9]{10}$/,
        'Phone number must be exactly 10 digits'
      )
      .trim()
      .optional(),
    type: yup
      .string()
      .oneOf(['head_quarter', 'franchise'], 'Type must be either head_quarter or franchise')
      .optional(),
    roleId: yup
      .string()
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID')
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
    franchiseId: yup
      .string()
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid franchise ID')
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

// Update staff status validation schema
export const updateStaffStatusSchema = yup.object({
  body: yup.object({
    status: yup
      .string()
      .required('Status is required')
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Staff ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
  }),
});

// Get staff by ID validation schema
export const getStaffByIdSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Staff ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
  }),
});

// Delete staff validation schema
export const deleteStaffSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Staff ID is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid staff ID'),
  }),
});

// Staff login validation schema
export const staffLoginSchema = yup.object({
  body: yup.object({
    username: yup
      .string()
      .required('Username is required')
      .trim(),
    password: yup
      .string()
      .required('Password is required'),
  }),
});
