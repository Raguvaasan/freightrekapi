import * as yup from 'yup';

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
    assignedHub: yup
      .string()
      .required('Assigned hub is required')
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid hub ID'),
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
    assignedHub: yup
      .string()
      .matches(/^[0-9a-fA-F]{24}$/, 'Invalid hub ID')
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
