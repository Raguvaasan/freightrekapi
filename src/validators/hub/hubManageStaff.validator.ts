import * as yup from 'yup';

export const createHubStaffSchema = yup.object({
  body: yup.object({
    name: yup.string().required('Name is required').min(2).max(100).trim(),
    email: yup.string().required('Email is required').email('Invalid email format').max(100).trim(),
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
    roleId: yup.string().matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID').optional(),
    status: yup.string().oneOf(['Active', 'Inactive']).optional(),
    username: yup.string().required('Username is required').min(3).max(50).trim(),
    password: yup.string().required('Password is required').min(6).max(100),
  }),
});

export const updateHubStaffSchema = yup.object({
  body: yup.object({
    name: yup.string().min(2).max(100).trim().optional(),
    email: yup.string().email('Invalid email format').max(100).optional(),
    phone: yup.string().matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').optional(),
    roleId: yup.string().matches(/^[0-9a-fA-F]{24}$/, 'Invalid role ID').optional(),
    status: yup.string().oneOf(['Active', 'Inactive']).optional(),
    username: yup.string().min(3).max(50).trim().optional(),
    password: yup.string().min(6).max(100).optional(),
  }),
});
