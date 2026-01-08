import * as yup from 'yup';

export const createCountrySchema = yup.object({
  name: yup.string().required('Country name is required').trim(),
  code: yup.string().required('Country code is required').trim().uppercase().min(2).max(3)
});

export const createStateSchema = yup.object({
  name: yup.string().required('State name is required').trim(),
  countryId: yup.string().required('Country ID is required').matches(/^[0-9a-fA-F]{24}$/, 'Invalid country ID'),
  code: yup.string().required('State code is required').trim().uppercase()
});

export const createCitySchema = yup.object({
  name: yup.string().required('City name is required').trim(),
  stateId: yup.string().required('State ID is required').matches(/^[0-9a-fA-F]{24}$/, 'Invalid state ID'),
  pincode: yup.string().optional().trim()
});
