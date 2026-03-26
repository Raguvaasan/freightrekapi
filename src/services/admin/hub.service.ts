import { HubModel } from '../../models/hub/hub.model'
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt';

export const createHub = async (rb: any) => {
  try {
    const hashedPassword = await bcrypt.hash(rb.password, 10);
    const hub = await HubModel.create({ ...rb, password: hashedPassword });
    return { success: true, data: hub }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
};

export const loginHub = async (username: string, password: string) => {
  try {
    const hub = await HubModel.findOne({ username }).select('+password');

    if (!hub) {
      return { success: false, message: 'Invalid credentials' };
    }

    if (!hub.status) {
      return { success: false, message: 'Hub account is inactive' };
    }

    // Support both bcrypt hashed (new) and plain text (legacy) passwords
    let isPasswordValid = false;
    if (hub.password.startsWith('$2')) {
      isPasswordValid = await bcrypt.compare(password, hub.password);
    } else {
      isPasswordValid = hub.password === password;
    }

    if (!isPasswordValid) {
      return { success: false, message: 'Invalid credentials' };
    }

    const hubData: any = hub.toObject();
    delete hubData.password;

    const token = generateToken(hub._id.toString());

    return { success: true, message: 'Hub login successful', data: { ...hubData, token } };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};


export const getHubs = async () => {
  try {
    const hubs = await HubModel.find();
    return { success: true, data: hubs };
  }
  catch (err: any) {
    return { success: false, message: err.message }
  }
};


export const getHubById = async (id: any) => {
  try {
    const hub = await HubModel.findById(id);
    return { success: true, data: hub };
  }
  catch (err: any) {
    return { success: false, message: err.message }
  }
};

export const updateHub = async (id: any, rb: any) => {
  try {

    const hub = await HubModel.findByIdAndUpdate(
      id,
      rb,
      { new: true }
    );

    if (!hub) {
      return { success: false, message: "Hub not found" };
    }

    return { success: true, data: hub };

  }
  catch (err: any) {
    return { success: false, data: err.message };
  }

};

export const deleteHub = async (id: any) => {
  try {
    const hub = await HubModel.findByIdAndDelete(id);

    if (!hub) {
      return { success: false, message: "Hub not found" };
    }

    return { success: true, message: "Hub deleted" }
  }
  catch (err: any) {
    return { success: false, data: err.message };
  }

};