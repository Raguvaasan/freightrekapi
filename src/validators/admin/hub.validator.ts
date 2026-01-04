import * as yup from "yup";

export const createHubSchema = yup.object({
  hubName: yup
    .string()
    .trim()
    .min(2, "hubName must be at least 2 characters")
    .required("hubName is required"),

  hubManagerName: yup
    .string()
    .trim()
    .min(2, "hubManagerName must be at least 2 characters")
    .required("hubManagerName is required"),

  phoneNo: yup
    .number()
    .min(10, "phoneNo must be 10 characters")
    .required("hubManagerName is required"),

  address: yup
    .string()
    .trim()
    .min(2, "address must be at least 2 characters")
    .required("address is required"),

  city: yup
    .string()
    .trim()
    .min(2, "city must be at least 2 characters")
    .required("city is required"),

  state: yup
    .string()
    .trim()
    .min(2, "state must be at least 2 characters")
    .required("state is required"),

  pincode: yup
    .number()
    .min(6, "pincode must be 6 characters")
    .required("pincode is required"),

  username: yup
    .string()
    .trim()
    .min(2, "username must be at least 2 characters")
    .required("username is required"),

  password: yup
    .string()
    .trim()
    .min(2, "password must be at least 2 characters")
    .required("password is required"),

  status: yup
    .boolean()
    .optional(),
});

export const updateHubSchema = createHubSchema.shape({
  hubName: yup
    .string()
    .min(2)
    .optional(),

  hubManagerName: yup
    .string()
    .min(2)
    .optional(),

  phoneNo: yup
    .number()
    .min(10)
    .optional(),

  address: yup
    .string()
    .min(2)
    .optional(),

  city: yup
    .string()
    .min(2)
    .optional(),

  state: yup
    .string()
    .min(2)
    .optional(),

  pincode: yup
    .number()
    .min(6)
    .optional(),

  username: yup
    .string()
    .min(2)
    .optional(),

  password: yup
    .string()
    .min(2)
    .optional(),

  status: yup
    .boolean()
    .optional(),
});