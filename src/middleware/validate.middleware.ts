import { Request, Response, NextFunction } from "express";
import { AnyObjectSchema } from "yup";

export const validate =
  (schema: AnyObjectSchema) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await schema.validate(req.body, {
          abortEarly: false, // return all errors
        });
        next();
      } catch (error: any) {
        const errors = error.inner.map((err: any) => ({
          field: err.path,
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors,
        });
      }
    };
