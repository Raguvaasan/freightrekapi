import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDB } from '../src/config/db';

let connectionPromise: Promise<void> | null = null;

const ensureDatabase = async () => {
  // Connected and ready
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Reset promise if previous connection dropped
  if (mongoose.connection.readyState !== 2) {
    connectionPromise = null;
  }

  if (!connectionPromise) {
    connectionPromise = connectDB().catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }

  await connectionPromise;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureDatabase();
    return app(req as any, res as any);
  } catch (error: any) {
    console.error('API handler error', error);
    // This response bypasses the express CORS middleware, so set the headers
    // here too — otherwise the browser reports a CORS failure instead of a 500
    const origin = req.headers.origin;
    if (typeof origin === 'string' && origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.status(500).json({ success: false, message: error?.message || 'Internal Server Error' });
  }
}
