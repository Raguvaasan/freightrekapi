import { Schema, model } from 'mongoose';

export interface IShipment {
  userId: string;
  orderId: string;
  waybill?: string;
  name: string;
  add: string;
  pin: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  order: string;
  paymentMode: 'Prepaid' | 'COD';
  fromName?: string;
  fromAdd?: string;
  fromPin?: string;
  fromCity?: string;
  fromState?: string;
  fromCountry?: string;
  fromPhone?: string;
  returnPin?: string;
  returnCity?: string;
  returnPhone?: string;
  returnAdd?: string;
  returnState?: string;
  returnCountry?: string;
  productsDesc?: string;
  hsnCode?: string;
  codAmount?: string;
  orderDate?: Date;
  totalAmount?: string;
  sellerAdd?: string;
  sellerName?: string;
  sellerInv?: string;
  quantity?: string;
  shipmentWidth?: string;
  shipmentHeight?: string;
  weight?: string;
  shippingMode: 'Surface' | 'Express';
  addressType?: string;
  pickupLocation: {
    name: string;
    address?: string;
    pincode?: string;
  };
  status: 'pending' | 'created' | 'Active' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  delhiveryResponse?: any;
  trackingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentSchema = new Schema<IShipment>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    waybill: {
      type: String,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    add: {
      type: String,
      required: true,
    },
    pin: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: 'India',
    },
    phone: {
      type: String,
      required: true,
    },
    order: {
      type: String,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ['Prepaid', 'COD'],
      required: true,
    },
    fromName: String,
    fromAdd: String,
    fromPin: String,
    fromCity: String,
    fromState: String,
    fromCountry: String,
    fromPhone: String,
    returnPin: String,
    returnCity: String,
    returnPhone: String,
    returnAdd: String,
    returnState: String,
    returnCountry: String,
    productsDesc: String,
    hsnCode: String,
    codAmount: String,
    orderDate: Date,
    totalAmount: String,
    sellerAdd: String,
    sellerName: String,
    sellerInv: String,
    quantity: String,
    shipmentWidth: {
      type: String,
      default: '100',
    },
    shipmentHeight: {
      type: String,
      default: '100',
    },
    weight: String,
    shippingMode: {
      type: String,
      enum: ['Surface', 'Express'],
      default: 'Surface',
    },
    addressType: String,
    pickupLocation: {
      name: {
        type: String,
        required: true,
      },
      address: {
        type: String,
      },
      pincode: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'created', 'Active', 'in_transit', 'delivered', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    delhiveryResponse: {
      type: Schema.Types.Mixed,
    },
    trackingUrl: String,
  },
  { timestamps: true }
);

// Create compound index for user queries
shipmentSchema.index({ userId: 1, createdAt: -1 });
shipmentSchema.index({ userId: 1, status: 1 });

export const Shipment = model<IShipment>('Shipment', shipmentSchema);
