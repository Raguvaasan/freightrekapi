import { CustomerUser } from '../../models/customer/customerUser.model';

export const getAllCustomerUsers = async (page: number, limit: number) => {
  try {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      CustomerUser.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      CustomerUser.countDocuments(),
    ]);

    return {
      success: true,
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

export const updateCustomerUser = async (id: string, updates: Record<string, any>) => {
  try {
    const customer = await CustomerUser.findByIdAndUpdate(id, updates, { new: true });
    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }
    return { success: true, message: 'Customer updated successfully', data: customer };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

export const deleteCustomerUser = async (id: string) => {
  try {
    const customer = await CustomerUser.findByIdAndDelete(id);
    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }
    return { success: true, message: 'Customer deleted successfully' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
