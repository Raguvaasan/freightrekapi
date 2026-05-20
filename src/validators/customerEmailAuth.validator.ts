import * as yup from 'yup';

export const customerEmailSignupSchema = yup.object({
  body: yup.object({
    firstName: yup.string().trim().required('First name is required'),
    lastName: yup.string().trim().required('Last name is required'),
    email: yup.string().trim().email('Invalid email format').required('Email is required'),
    password: yup
      .string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  }),
});

export const customerEmailLoginSchema = yup.object({
  body: yup.object({
    email: yup.string().trim().email('Invalid email format').required('Email is required'),
    password: yup.string().required('Password is required'),
  }),
});
