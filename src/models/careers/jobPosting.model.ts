import { Schema, model, Types } from 'mongoose';

export interface IJobPosting {
  _id: Types.ObjectId;
  title: string;
  experience: string;
  qualification: string;
  shortDesc: string;
  description: string[];
  skills: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const jobPostingSchema = new Schema<IJobPosting>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    experience: {
      type: String,
      required: true,
      trim: true
    },
    qualification: {
      type: String,
      required: true,
      trim: true
    },
    shortDesc: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: [String],
      required: true,
      default: []
    },
    skills: {
      type: [String],
      required: true,
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
jobPostingSchema.index({ isActive: 1 });
jobPostingSchema.index({ title: 1 });

export const JobPosting = model<IJobPosting>('JobPosting', jobPostingSchema);
