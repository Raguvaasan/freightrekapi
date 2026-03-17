import bcrypt from 'bcryptjs';
import { AppCustomer } from '../models/customer/appCustomer.model';
import { Customer } from '../models/customer/customer.model';
import { generateToken } from '../utils/jwt';

interface ServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
}

export const customerAuthService = {
  async register(input: RegisterInput): Promise<ServiceResponse> {
    const { firstName, lastName, email, phone, countryCode, password } = input;

    const existingEmail = await AppCustomer.findOne({ email });
    if (existingEmail) {
      return { success: false, message: 'An account with this email already exists' };
    }

    const existingPhone = await AppCustomer.findOne({ phone, countryCode });
    if (existingPhone) {
      return { success: false, message: 'An account with this phone number already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await AppCustomer.create({
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      password: hashedPassword,
    });

    // Also add to admin customers collection (name = firstName + lastName)
    const existingAdminCustomer = await Customer.findOne({ email });
    if (!existingAdminCustomer) {
      await Customer.create({
        name: `${firstName} ${lastName}`,
        email,
        phone,
        status: 'Active',
      });
    }

    const token = generateToken(customer._id.toString());

    return {
      success: true,
      message: 'Registration successful',
      data: {
        token,
        customer: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          countryCode: customer.countryCode,
          status: customer.status,
        },
      },
    };
  },
};
