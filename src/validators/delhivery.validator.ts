import * as yup from "yup";

// Minimal placeholder schemas; adjust per Delhivery spec when available
const objectId = /^[0-9a-fA-F]{24}$/;

export const pincodeServiceabilitySchema = yup.object({
  pin: yup.string().required(),
});

export const fetchWaybillSchema = yup.object({
  count: yup.number().min(1).max(1000).required(),
});

export const shipmentManifestSchema = yup.object({
  orderId: yup.string().required(),
  waybill: yup.string().optional(),
});

export const shipmentUpdateSchema = yup.object({
  waybill: yup.string().required(),
  updates: yup.object().required(),
});

export const shipmentCancelSchema = yup.object({
  waybill: yup.string().required(),
});

export const ewaybillSchema = yup.object({
  waybill: yup.string().required(),
  ewaybillNumber: yup.string().required(),
});

export const shipmentTrackingSchema = yup.object({
  waybill: yup.string().required(),
});

export const shippingCostSchema = yup.object({
  fromPincode: yup.string().required(),
  toPincode: yup.string().required(),
  weight: yup.number().required(),
});

export const labelSchema = yup.object({
  waybill: yup.string().required(),
});

export const pickupRequestSchema = yup.object({
  pickupLocation: yup.string().required(),
  shipments: yup.array().of(yup.string()).required(),
});

export const warehouseCreateSchema = yup.object({
  name: yup.string().required(),
  address: yup.string().required(),
  pincode: yup.string().required(),
});

export const warehouseUpdateSchema = yup.object({
  warehouseId: yup.string().matches(objectId).required(),
});

export const webhookConfigSchema = yup.object({
  url: yup.string().url().required(),
  events: yup.array().of(yup.string()).required(),
});

export const downloadDocumentSchema = yup.object({
  waybill: yup.string().required(),
});

export const rvpQcSchema = yup.object({
  orderId: yup.string().required(),
});

export const ndrActionSchema = yup.object({
  waybill: yup.string().required(),
  action: yup.string().required(),
});
