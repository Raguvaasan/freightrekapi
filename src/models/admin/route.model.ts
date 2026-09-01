import { Schema, model } from 'mongoose';

export interface IRoute {
  routeName: string;
  from: string;
  to: string;
  branches: string[];
  transportationCharge: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const routeSchema = new Schema<IRoute>(
  {
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },
    from: {
      type: String,
      required: [true, 'Origin location is required'],
      trim: true,
    },
    to: {
      type: String,
      required: [true, 'Destination location is required'],
      trim: true,
    },
    branches: {
      type: [String],
      default: [],
    },
    transportationCharge: {
      type: Number,
      default: 0,
      min: [0, 'Transportation charge cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate routes for the same origin/destination pair
routeSchema.index({ from: 1, to: 1 }, { unique: true });
routeSchema.index({ status: 1 });

export const Route = model<IRoute>('Route', routeSchema);
