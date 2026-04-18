import bcrypt from "bcryptjs";
import { AdminUser } from "../../models/admin/adminUser.model";
import { generateToken } from "../../utils/jwt";
import { checkPhoneGloballyUnique } from '../../utils/phoneCheck';


export const register = async (rb: any) => {
  try {
    const { name, email, password, phoneNo, roleId } = rb;

    const existingUser = await AdminUser.findOne({ email });
    if (existingUser) {
      return { success: false, message: "User already exists" };
    }

    // Check phone global uniqueness
    const phoneError = await checkPhoneGloballyUnique(phoneNo);
    if (phoneError) {
      return { success: false, message: phoneError };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await AdminUser.create({
      name,
      email,
      phoneNo,
      password: hashedPassword,
      roleId
    });

    return {
      success: true,
      message: "User registered successfully",
    }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
};


export const login = async (rb: any) => {
  try {
    const { email, password } = rb;

    const user = await AdminUser.findOne({ email }).select("+password");
    if (!user) {
      return { success: false, message: "Invalid credentials" };
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: "Invalid credentials" };
    }

    return {
      success: true,
      message: "Login successful",
      token: generateToken(user._id.toString())
    }
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

