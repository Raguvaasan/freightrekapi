import * as yup from 'yup';

export const createCareerApplicationSchema = yup.object({
  jobPostingId: yup
    .string()
    .required('Job posting ID is required')
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid job posting ID'),
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^[0-9\-\+\s\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 characters')
    .trim(),
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required')
    .trim()
    .lowercase(),
  coveringMessage: yup
    .string()
    .required('Covering message is required')
    .min(10, 'Covering message must be at least 10 characters')
    .max(2000, 'Covering message must not exceed 2000 characters')
    .trim(),
  resumePath: yup
    .string()
    .required('Resume file path is required')
    .trim()
});

export const updateCareerApplicationSchema = yup.object({
  name: yup
    .string()
    .optional()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  phone: yup
    .string()
    .optional()
    .matches(/^[0-9\-\+\s\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 characters')
    .trim(),
  email: yup
    .string()
    .email('Invalid email address')
    .optional()
    .trim()
    .lowercase(),
  coveringMessage: yup
    .string()
    .optional()
    .min(10, 'Covering message must be at least 10 characters')
    .max(2000, 'Covering message must not exceed 2000 characters')
    .trim(),
  status: yup
    .string()
    .oneOf(['pending', 'reviewed', 'rejected', 'accepted'], 'Invalid status')
    .optional()
});
