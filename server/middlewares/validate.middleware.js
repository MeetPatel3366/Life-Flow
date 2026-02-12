import fs from "fs";

export const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }

    if (schema.params) {
      Object.assign(req.params, schema.params.parse(req.params));
    }

    if (schema.query) {
      Object.assign(req.query, schema.query.parse(req.query));
    }

    next();
  } catch (error) {
    console.log("validation error: ", error);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const issues = error.issues || error.errors || [];

    return res.status(400).json({
      errors:
        Array.isArray(issues) && issues.length > 0
          ? issues.map((e) => ({
              field: Array.isArray(e.path) ? e.path.join(".") : "unknown",
              message: e.message,
            }))
          : [{ message: "Internal Validation Error" }],
    });
  }
};
