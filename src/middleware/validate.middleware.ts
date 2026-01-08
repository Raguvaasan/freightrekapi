import { Request, Response, NextFunction } from "express";
import { AnyObjectSchema } from "yup";

export const validate =
  (schema: AnyObjectSchema) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const schemaFields = (schema as any)?.fields || {};
        const hasWrapper = schemaFields.body !== undefined || 
                          schemaFields.params !== undefined || 
                          schemaFields.query !== undefined;

        const payload = hasWrapper
          ? { body: req.body, params: req.params, query: req.query }
          : req.body;

        const parsed = await schema.validate(payload, {
          abortEarly: false, // return all errors
          stripUnknown: true,
        });

        // Overwrite with parsed values if present
        if (hasWrapper && parsed) {
          if ((parsed as any).body) req.body = (parsed as any).body;
          if ((parsed as any).params) req.params = (parsed as any).params as any;
          if ((parsed as any).query) req.query = (parsed as any).query as any;
        } else if (parsed) {
          req.body = parsed as any;
        }

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
