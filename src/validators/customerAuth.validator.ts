import * as yup from 'yup';

export const customerRegisterSchema = yup.object({
  body: yup.object({
    firstName: yup
      .string()
      .required('First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .trim(),
    lastName: yup
      .string()
      .required('Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .trim(),
    countryCode: yup
      .string()
      .required('Country code is required')
      .matches(/^\+\d{1,4}$/, 'Country code must be in format +1 to +9999')
      .trim(),
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(/^\d{7,15}$/, 'Phone number must be 7–15 digits')
      .trim(),
    email: yup
      .string()
      .required('Email is required')
      .email('Invalid email format')
      .max(100, 'Email must not exceed 100 characters')
      .trim(),
    password: yup
      .string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password must not exceed 128 characters'),
  }),
});

export const sendOtpSchema = yup.object({
  body: yup.object({
    countryCode: yup
      .string()
      .required('Country code is required')
      .matches(/^\+\d{1,4}$/, 'Country code must be in format +1 to +9999')
      .trim(),
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(/^\d{7,15}$/, 'Phone number must be 7–15 digits')
      .trim(),
  }),
});

export const verifyOtpSchema = yup.object({
  body: yup.object({
    countryCode: yup
      .string()
      .required('Country code is required')
      .matches(/^\+\d{1,4}$/, 'Country code must be in format +1 to +9999')
      .trim(),
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(/^\d{7,15}$/, 'Phone number must be 7–15 digits')
      .trim(),
    otp: yup
      .string()
      .required('OTP is required')
      .matches(/^\d{6}$/, 'OTP must be exactly 6 digits'),
  }),
});
