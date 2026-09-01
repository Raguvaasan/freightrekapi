import * as yup from 'yup';

/**
 * A booking customer is identified by mobile number — there is no id, the
 * details live on the parcel orders. Kept loose (6-15 digits) so a number saved
 * before the 10-digit rule was enforced can still be opened.
 */
export const bookingCustomerByMobileSchema = yup.object({
  params: yup.object({
    mobileNumber: yup
      .string()
      .required('Mobile number is required')
      .matches(/^[0-9]{6,15}$/, 'Mobile number must be 6-15 digits')
      .trim(),
  }),
});
