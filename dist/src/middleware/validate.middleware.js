"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => async (req, res, next) => {
    try {
        const schemaFields = schema?.fields || {};
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
            if (parsed.body)
                req.body = parsed.body;
            if (parsed.params)
                req.params = parsed.params;
            if (parsed.query)
                req.query = parsed.query;
        }
        else if (parsed) {
            req.body = parsed;
        }
        next();
    }
    catch (error) {
        const errors = error.inner.map((err) => ({
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
exports.validate = validate;
