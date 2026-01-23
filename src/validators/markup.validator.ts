import * as yup from 'yup';

/**
 * Validator for creating/updating markup
 */
export const createMarkupSchema = yup.object({
  body: yup.object({
    markup_type: yup
      .string()
      .required('markup_type is required')
      .oneOf(['percentage', 'fixed'], 'markup_type must be either percentage or fixed'),
    markup_value: yup
      .number()
      .required('markup_value is required')
      .min(0, 'markup_value must be greater than or equal to 0')
      .test(
        'percentage-range',
        'markup_value must be between 0 and 100 for percentage type',
        function (value) {
          const { markup_type } = this.parent;
          if (markup_type === 'percentage') {
            return value !== undefined && value >= 0 && value <= 100;
          }
          return true;
        }
      ),
    user_id: yup.string().optional(),
    franchise_id: yup.string().optional(),
  }),
});

/**
 * Validator for GET query parameters (optional)
 */
export const getMarkupQuerySchema = yup.object({
  query: yup.object({
    user_id: yup.string().optional(),
    franchise_id: yup.string().optional(),
  }),
});
