import { HubModel } from '../../models/hub/hub.model'

export const createHub = async (rb: any) => {
  try {
    const hub = await HubModel.create(rb);
    return { success: true, data: hub }
  } catch (err: any) {
    return { success: false, message: err.message }
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