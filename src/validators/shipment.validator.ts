import * as yup from 'yup';

export const createShipmentSchema = yup.object().shape({
  name: yup.string().required('Consignee name is required'),
  add: yup.string().required('Address is required'),
  pin: yup
    .string()
    .required('PIN code is required')
    .matches(/^\d{6}$/, 'PIN code must be 6 digits'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  country: yup.string().default('India'),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^\d{10}$/, 'Phone number must be 10 digits'),
  order: yup.string().required('Order reference is required'),
  paymentMode: yup
    .string()
    .required('Payment mode is required')
    .oneOf(['Prepaid', 'COD'], 'Payment mode must be Prepaid or COD'),
  returnPin: yup.string(),
  returnCity: yup.string(),
  returnPhone: yup.string(),
  returnAdd: yup.string(),
  returnState: yup.string(),
  returnCountry: yup.string(),
  productsDesc: yup.string(),
  hsnCode: yup.string(),
  codAmount: yup.string(),
  orderDate: yup.date(),
  totalAmount: yup.string(),
  sellerAdd: yup.string(),
  sellerName: yup.string(),
  sellerInv: yup.string(),
  quantity: yup.string(),
  waybill: yup.string(),
  shipmentWidth: yup.string(),
  shipmentHeight: yup.string(),
  weight: yup.string(),
  shippingMode: yup
    .string()
    .oneOf(['Surface', 'Express'], 'Shipping mode must be Surface or Express')
    .default('Surface'),
  addressType: yup.string(),
  pickupLocation: yup.object().shape({
    name: yup.string().required('Pickup location name is required'),
  }),
});

export const getShipmentsSchema = yup.object().shape({
  page: yup.number().min(1, 'Page must be at least 1'),
  limit: yup.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
  status: yup
    .string()
    .oneOf(
      ['pending', 'created', 'in_transit', 'delivered', 'failed', 'cancelled'],
      'Invalid status'
    ),
});
