import * as yup from "yup";

export const registerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),

  email: yup
    .string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email is required"),

  phoneNo: yup
    .string()
    .required("Phone number is required")
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits"),

  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),

  roleId: yup
    .string()
    .required("Role ID is required")
    .matches(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId format")
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email is required"),

  password: yup
    .string()
    .required("Password is required"),
});