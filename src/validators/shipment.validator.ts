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
    .transform((value) => (!value ? 'COD' : value))
    .oneOf(['Prepaid', 'COD'], 'Payment mode must be Prepaid or COD')
    .default('COD'),
  fromName: yup.string(),
  fromAdd: yup.string(),
  fromPin: yup.string().matches(/^\d{6}$/, 'From PIN code must be 6 digits'),
  fromCity: yup.string(),
  fromState: yup.string(),
  fromCountry: yup.string(),
  fromPhone: yup.string().matches(/^\d{10}$/, 'From phone number must be 10 digits'),
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
  totalAmount: yup.string().test(
    'positive-if-present',
    'Total amount must be greater than 0',
    (val) => (!val || parseFloat(val) > 0)
  ),
  sellerAdd: yup.string(),
  sellerName: yup.string(),
  sellerInv: yup.string(),
  quantity: yup.string(),
  waybill: yup.string(),
  shipmentWidth: yup.string(),
  shipmentHeight: yup.string(),
  shipmentLength: yup.string(),
  weight: yup.string(),
  shippingMode: yup
    .string()
    .oneOf(['Surface', 'Express'], 'Shipping mode must be Surface or Express')
    .default('Surface'),
  addressType: yup.string(),
  pickupLocation: yup.object().shape({
    name: yup.string().optional(),
    address: yup.string().optional(),
    pincode: yup.string().optional(),
    city: yup.string().optional(),
    state: yup.string().optional(),
    country: yup.string().optional(),
    phone: yup.string().optional(),
  }).optional(),
  assignedStaffId: yup.string().optional(),
  orderType: yup.string().oneOf(['hub', 'customer'], 'Order type must be hub or customer').optional(),
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

export const updateShipmentSchema = yup.object().shape({
  name: yup.string(),
  add: yup.string(),
  pin: yup.string().matches(/^\d{6}$/, 'PIN code must be 6 digits'),
  city: yup.string(),
  state: yup.string(),
  country: yup.string(),
  phone: yup.string().matches(/^\d{10}$/, 'Phone number must be 10 digits'),
  paymentMode: yup.string().oneOf(['Prepaid', 'COD'], 'Payment mode must be Prepaid or COD'),
  status: yup
    .string()
    .oneOf(
      ['pending', 'created', 'in_transit', 'delivered', 'failed', 'cancelled'],
      'Invalid status'
    ),
  fromName: yup.string(),
  fromAdd: yup.string(),
  fromPin: yup.string().matches(/^\d{6}$/, 'From PIN code must be 6 digits'),
  fromCity: yup.string(),
  fromState: yup.string(),
  fromCountry: yup.string(),
  fromPhone: yup.string().matches(/^\d{10}$/, 'From phone number must be 10 digits'),
  returnPin: yup.string(),
  returnCity: yup.string(),
  returnPhone: yup.string(),
  returnAdd: yup.string(),
  returnState: yup.string(),
  returnCountry: yup.string(),
  productsDesc: yup.string(),
  codAmount: yup.string(),
  totalAmount: yup.string(),
  weight: yup.string(),
  shippingMode: yup.string().oneOf(['Surface', 'Express'], 'Shipping mode must be Surface or Express'),
});
