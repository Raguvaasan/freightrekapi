import { HubModel } from '../../models/hub/hub.model'
import { Staff } from '../../models/admin/staff.model'
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt';
import { checkPhoneGloballyUnique } from '../../utils/phoneCheck';

export const createHub = async (rb: any) => {
  try {
    // Check phone global uniqueness
    const phoneError = await checkPhoneGloballyUnique(String(rb.phoneNo));
    if (phoneError) {
      return { success: false, message: phoneError };
    }

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
    // Check phone global uniqueness if updating phone
    if (rb.phoneNo !== undefined) {
      const phoneError = await checkPhoneGloballyUnique(String(rb.phoneNo), { model: 'Hub', id });
      if (phoneError) {
        return { success: false, message: phoneError };
      }
    }

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

export const unifiedHubLogin = async (username: string, password: string) => {
  try {
    // Step 1: Try hub admin login
    const hub = await HubModel.findOne({ username }).select('+password');
    if (hub) {
      if (!hub.status) {
        return { success: false, message: 'Hub account is inactive' };
      }

      let isPasswordValid = false;
      if (hub.password.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(password, hub.password);
      } else {
        isPasswordValid = hub.password === password;
      }

      if (isPasswordValid) {
        const hubData: any = hub.toObject();
        delete hubData.password;
        const token = generateToken(hub._id.toString());
        return { success: true, message: 'Hub login successful', data: { ...hubData, token, loginType: 'hub' } };
      }
    }

    // Step 2: Try hub staff login
    const staff = await Staff.findOne({ username })
      .select('+password')
      .populate('hubId', 'hubName city pincode');

    if (staff) {
      if (staff.type !== 'hub') {
        return { success: false, message: 'Invalid credentials' };
      }

      if (!staff.hubId) {
        return { success: false, message: 'Hub information missing. Contact administrator.' };
      }

      const isPasswordValid = await bcrypt.compare(password, staff.password!);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      if (staff.status !== 'Active') {
        return { success: false, message: 'Staff account is inactive' };
      }

      const staffData: any = staff.toObject();
      delete staffData.password;
      const token = generateToken(staff._id.toString());
      return { success: true, message: 'Hub staff login successful', data: { ...staffData, token, loginType: 'hub_staff' } };
    }

    return { success: false, message: 'Invalid credentials' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};