import { HubModel } from '../../models/hub/hub.model'
import { Staff } from '../../models/admin/staff.model'
import { HubRole } from '../../models/hub/hubRole.model'
import { Types } from 'mongoose';
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

    // Credentials are optional - a hub signs in by phone OTP. Only hash a
    // password when one was actually sent, and leave the username unset rather
    // than storing an empty string, which would take the unique-index slot.
    const { username, password, ...rest } = rb;

    const hub = await HubModel.create({
      ...rest,
      ...(username ? { username } : {}),
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    });
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

    // A hub created without credentials signs in by phone OTP instead
    if (!hub.password) {
      return {
        success: false,
        message: 'This hub has no password set. Sign in by phone OTP at /admin/login/send-otp',
      };
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

// Picks the hub that the staff of `hubBeingDeleted` should move to. Nearest
// first — same city, then same state — so staff stay with a hub they can
// realistically work out of; any other active hub is the last resort.
const findReassignmentHub = async (hubBeingDeleted: any, preferredHubId?: string) => {
  if (preferredHubId) {
    if (!Types.ObjectId.isValid(preferredHubId)) {
      return { error: 'Invalid reassignHubId' };
    }
    if (preferredHubId === hubBeingDeleted._id.toString()) {
      return { error: 'reassignHubId cannot be the hub being deleted' };
    }
    const preferred = await HubModel.findById(preferredHubId);
    if (!preferred) {
      return { error: 'Hub to reassign staff to was not found' };
    }
    if (!preferred.status) {
      return { error: 'Hub to reassign staff to is inactive' };
    }
    return { hub: preferred };
  }

  const exclude = { _id: { $ne: hubBeingDeleted._id }, status: true };
  const hub =
    (await HubModel.findOne({ ...exclude, city: hubBeingDeleted.city }).sort({ createdAt: 1 })) ||
    (await HubModel.findOne({ ...exclude, state: hubBeingDeleted.state }).sort({ createdAt: 1 })) ||
    (await HubModel.findOne(exclude).sort({ createdAt: 1 }));

  return hub ? { hub } : { error: null };
};

// Hub-scoped roles don't travel with the staff — a HubRole belongs to the hub
// it was created under. Match by name in the target hub when one exists, and
// otherwise drop the role so nobody keeps permissions granted by a hub that no
// longer exists.
const remapHubRoles = async (staffList: any[], targetHubId: Types.ObjectId) => {
  for (const staff of staffList) {
    if (!staff.roleId) continue;

    const oldRole = await HubRole.findById(staff.roleId).lean();
    if (!oldRole) continue; // not a HubRole (AdminRole etc.) - leave it alone

    const newRole = await HubRole.findOne({
      hubId: targetHubId,
      roleName: oldRole.roleName,
      status: true,
    }).lean();

    await Staff.updateOne(
      { _id: staff._id },
      newRole ? { $set: { roleId: newRole._id } } : { $unset: { roleId: '' } }
    );
  }
};

export const deleteHub = async (id: any, reassignHubId?: string) => {
  try {
    const hub = await HubModel.findById(id);

    if (!hub) {
      return { success: false, message: "Hub not found" };
    }

    const staffList = await Staff.find({ type: 'hub', hubId: hub._id });

    let reassignedTo: any = null;

    if (staffList.length) {
      const { hub: targetHub, error } = await findReassignmentHub(hub, reassignHubId);

      if (error) {
        return { success: false, message: error };
      }

      // Deleting anyway would leave the staff pointing at a hub that no longer
      // exists - they vanish from the admin hub staff list while still holding
      // the phone/email/username uniqueness slots.
      if (!targetHub) {
        return {
          success: false,
          message: `Cannot delete hub: ${staffList.length} staff are assigned to it and there is no other active hub to move them to. Create another hub or remove the staff first.`,
        };
      }

      await Staff.updateMany(
        { type: 'hub', hubId: hub._id },
        { $set: { hubId: targetHub._id } }
      );
      await remapHubRoles(staffList, targetHub._id as Types.ObjectId);

      reassignedTo = targetHub;
    }

    await HubModel.findByIdAndDelete(hub._id);
    await HubRole.deleteMany({ hubId: hub._id });

    return {
      success: true,
      message: reassignedTo
        ? `Hub deleted. ${staffList.length} staff reassigned to "${reassignedTo.hubName}"`
        : "Hub deleted",
      data: {
        reassignedStaffCount: staffList.length,
        reassignedToHub: reassignedTo
          ? { _id: reassignedTo._id, hubName: reassignedTo.hubName, city: reassignedTo.city }
          : null,
      },
    }
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

      // A hub created without credentials signs in by phone OTP instead; fall
      // through to the staff lookup rather than throwing on an absent password
      let isPasswordValid = false;
      if (hub.password) {
        isPasswordValid = hub.password.startsWith('$2')
          ? await bcrypt.compare(password, hub.password)
          : hub.password === password;
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