import bcrypt from 'bcryptjs';
import { CustomerUser } from '../models/customer/customerUser.model';
import { generateToken } from '../utils/jwt';

export const signup = async (rb: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobileNumber: string;
  gst: string;
}) => {
  try {
    const { firstName, lastName, email, password, mobileNumber, gst } = rb;

    const existingCustomer = await CustomerUser.findOne({ email });
    if (existingCustomer) {
      return { success: false, message: 'Customer with this email already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await CustomerUser.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      mobileNumber,
      gst,
    });

    const token = generateToken(customer._id.toString());

    return {
      success: true,
      message: 'Customer registered successfully',
      data: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        gst: customer.gst,
        status: customer.status,
      },
      token,
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

export const login = async (rb: { email: string; password: string }) => {
  try {
    const { email, password } = rb;

    const customer = await CustomerUser.findOne({ email }).select('+password');
    if (!customer) {
      return { success: false, message: 'Invalid credentials' };
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return { success: false, message: 'Invalid credentials' };
    }

    const token = generateToken(customer._id.toString());

    return {
      success: true,
      message: 'Login successful',
      data: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        gst: customer.gst,
        status: customer.status,
      },
      token,
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
