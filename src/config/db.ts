import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("DB connection failed", error);
    // Avoid killing the serverless function runtime; let caller decide how to handle the failure
    if (process.env.VERCEL) {
      throw error;
    }

    process.exit(1);
  }
};
