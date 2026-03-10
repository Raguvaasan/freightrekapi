import * as yup from 'yup';

export const createJobPostingSchema = yup.object({
  title: yup.string().required('Job title is required').trim(),
  experience: yup.string().required('Experience is required').trim(),
  qualification: yup.string().required('Qualification is required').trim(),
  shortDesc: yup.string().required('Short description is required').trim(),
  description: yup
    .array()
    .of(yup.string().trim())
    .required('Description is required')
    .min(1, 'At least one description point is required'),
  skills: yup
    .array()
    .of(yup.string().trim())
    .required('Skills are required')
    .min(1, 'At least one skill is required')
});

export const updateJobPostingSchema = yup.object({
  title: yup.string().optional().trim(),
  experience: yup.string().optional().trim(),
  qualification: yup.string().optional().trim(),
  shortDesc: yup.string().optional().trim(),
  description: yup
    .array()
    .of(yup.string().trim())
    .optional(),
  skills: yup
    .array()
    .of(yup.string().trim())
    .optional(),
  isActive: yup.boolean().optional()
});
