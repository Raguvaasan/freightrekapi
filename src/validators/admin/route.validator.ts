import * as yup from 'yup';

const objectId = /^[0-9a-fA-F]{24}$/;

// Create route validation schema
export const createRouteSchema = yup.object({
  body: yup.object({
    routeName: yup
      .string()
      .required('Route name is required')
      .min(2, 'Route name must be at least 2 characters')
      .max(150, 'Route name must not exceed 150 characters')
      .trim(),
    from: yup
      .string()
      .required('Origin location is required')
      .min(2, 'Origin location must be at least 2 characters')
      .max(150, 'Origin location must not exceed 150 characters')
      .trim(),
    to: yup
      .string()
      .required('Destination location is required')
      .min(2, 'Destination location must be at least 2 characters')
      .max(150, 'Destination location must not exceed 150 characters')
      .trim(),
    branches: yup
      .array()
      .of(yup.string().trim().min(1, 'Branch name cannot be empty'))
      .optional(),
    transportationCharge: yup
      .number()
      .typeError('Transportation charge must be a number')
      .min(0, 'Transportation charge cannot be negative')
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
  }),
});

// Update route validation schema
export const updateRouteSchema = yup.object({
  body: yup.object({
    routeName: yup
      .string()
      .min(2, 'Route name must be at least 2 characters')
      .max(150, 'Route name must not exceed 150 characters')
      .trim()
      .optional(),
    from: yup
      .string()
      .min(2, 'Origin location must be at least 2 characters')
      .max(150, 'Origin location must not exceed 150 characters')
      .trim()
      .optional(),
    to: yup
      .string()
      .min(2, 'Destination location must be at least 2 characters')
      .max(150, 'Destination location must not exceed 150 characters')
      .trim()
      .optional(),
    branches: yup
      .array()
      .of(yup.string().trim().min(1, 'Branch name cannot be empty'))
      .optional(),
    transportationCharge: yup
      .number()
      .typeError('Transportation charge must be a number')
      .min(0, 'Transportation charge cannot be negative')
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Route ID is required')
      .matches(objectId, 'Invalid route ID'),
  }),
});

// Update route branches validation schema (Branch Management)
export const updateRouteBranchesSchema = yup.object({
  body: yup.object({
    branches: yup
      .array()
      .of(yup.string().trim().min(1, 'Branch name cannot be empty'))
      .required('Branches list is required'),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Route ID is required')
      .matches(objectId, 'Invalid route ID'),
  }),
});

// Update route status validation schema
export const updateRouteStatusSchema = yup.object({
  body: yup.object({
    status: yup
      .string()
      .required('Status is required')
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive'),
  }),
  params: yup.object({
    id: yup
      .string()
      .required('Route ID is required')
      .matches(objectId, 'Invalid route ID'),
  }),
});

// Get route by ID validation schema
export const getRouteByIdSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Route ID is required')
      .matches(objectId, 'Invalid route ID'),
  }),
});

// Delete route validation schema
export const deleteRouteSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .required('Route ID is required')
      .matches(objectId, 'Invalid route ID'),
  }),
});
