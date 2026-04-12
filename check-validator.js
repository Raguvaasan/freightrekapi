require('dotenv').config();
const yup = require('yup');

const createShipmentSchema = yup.object().shape({
  name: yup.string().required(),
  add: yup.string().required(),
  pin: yup.string().required(),
  city: yup.string().required(),
  state: yup.string().required(),
  country: yup.string().default('India'),
  phone: yup.string().required(),
  order: yup.string().required(),
  paymentMode: yup.string().default('COD'),
  fromName: yup.string(),
  fromAdd: yup.string(),
  fromPin: yup.string(),
  fromCity: yup.string(),
  fromState: yup.string(),
  fromCountry: yup.string(),
  fromPhone: yup.string(),
  totalAmount: yup.string(),
  codAmount: yup.string(),
  weight: yup.string(),
  shippingMode: yup.string().default('Surface'),
  orderType: yup.string().optional(),
  baseAmount: yup.mixed().optional(),
  markupAmount: yup.mixed().optional(),
  markupType: yup.string().optional(),
  markupValue: yup.mixed().optional(),
});

const payload = {
  name: "Ragu Vaasan",
  add: "37, 25A, Redhills Road, Kolathur",
  pin: "600099",
  city: "Chennai",
  state: "Tamil Nadu",
  phone: "6385586117",
  order: "ORD_TEST_123",
  paymentMode: "COD",
  fromName: "Sender Name",
  fromAdd: "Sender Address",
  fromPin: "625531",
  fromCity: "Theni",
  fromState: "Tamil Nadu",
  fromPhone: "9999999999",
  totalAmount: "86",
  weight: "500"
};

createShipmentSchema.validate(payload, { abortEarly: false, stripUnknown: true })
  .then(result => {
    console.log('Validated result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\nfromName present:', !!result.fromName);
    console.log('fromAdd present:', !!result.fromAdd);
  })
  .catch(err => console.error('Validation error:', err));
