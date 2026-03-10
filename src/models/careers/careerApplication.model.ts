import { Schema, model, Types } from 'mongoose';

export interface ICareerApplication {
  _id: Types.ObjectId;
  jobPostingId: Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  coveringMessage: string;
  resumePath: string;
  status: 'pending' | 'reviewed' | 'rejected' | 'accepted';
  createdAt: Date;
  updatedAt: Date;
}

const careerApplicationSchema = new Schema<ICareerApplication>(
  {
    jobPostingId: {
      type: Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    coveringMessage: {
      type: String,
      required: true,
      trim: true
    },
    resumePath: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'rejected', 'accepted'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
careerApplicationSchema.index({ jobPostingId: 1 });
careerApplicationSchema.index({ email: 1 });
careerApplicationSchema.index({ status: 1 });
careerApplicationSchema.index({ createdAt: -1 });

export const CareerApplication = model<ICareerApplication>('CareerApplication', careerApplicationSchema);
