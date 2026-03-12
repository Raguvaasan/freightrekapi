import * as yup from 'yup';

export const createCustomerSchema = yup.object({
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
      .optional(),
    gstNumber: yup
      .string()
      .max(20, 'GST number must not exceed 20 characters')
      .trim()
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
  }),
});

export const updateCustomerSchema = yup.object({
  params: yup.object({
    id: yup.string().required('Customer ID is required'),
  }),
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
      .optional(),
    gstNumber: yup
      .string()
      .max(20, 'GST number must not exceed 20 characters')
      .trim()
      .optional(),
    status: yup
      .string()
      .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
      .optional(),
  }),
});

export const customerIdParamSchema = yup.object({
  params: yup.object({
    id: yup.string().required('Customer ID is required'),
  }),
});
