/**
 * Validation middleware for request data with better error handling
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      console.log("Validation middleware - Request body:", req.body);
      console.log("Validation middleware - Schema:", schema);

      // Check if body parsing failed
      if (req.body === undefined) {
        console.log("Body parsing failed - req.body is undefined");
        return res.status(400).json({
          success: false,
          message:
            "Invalid request format. Please check Content-Type header and ensure valid JSON body.",
        });
      }

      const errors = [];

      // Ensure req.body exists
      req.body = req.body || {};

      const data = {
        body: req.body,
        query: req.query || {},
        params: req.params || {},
      };

      // Validate required fields for body
      if (schema.body && schema.body.required) {
        for (const field of schema.body.required) {
          // Check if field exists and has a value
          if (
            data.body[field] === undefined ||
            data.body[field] === null ||
            data.body[field] === ""
          ) {
            errors.push({
              field,
              message: `Field '${field}' is required`,
            });
          }
        }
      }

      // Validate field types and formats for body (only if body exists)
      if (schema.body && schema.body.properties && req.body) {
        for (const [field, rules] of Object.entries(schema.body.properties)) {
          const value = data.body[field];

          // Skip validation if field is not provided
          if (value === undefined || value === null) continue;

          // Type validation
          if (rules.type === "string") {
            if (typeof value !== "string") {
              errors.push({
                field,
                message: `Field '${field}' must be a string`,
              });
            } else if (rules.minLength && value.length < rules.minLength) {
              errors.push({
                field,
                message: `Field '${field}' must be at least ${rules.minLength} characters long`,
              });
            } else if (rules.maxLength && value.length > rules.maxLength) {
              errors.push({
                field,
                message: `Field '${field}' must be at most ${rules.maxLength} characters long`,
              });
            }
          }

          // Enum validation
          if (rules.enum && !rules.enum.includes(value)) {
            errors.push({
              field,
              message: `Field '${field}' must be one of: ${rules.enum.join(
                ", "
              )}`,
            });
          }

          // URI format validation (basic)
          if (rules.format === "uri" && value) {
            try {
              // Basic URL validation
              if (
                !value.startsWith("http://") &&
                !value.startsWith("https://") &&
                !value.startsWith("data:")
              ) {
                errors.push({
                  field,
                  message: `Field '${field}' must be a valid URL starting with http://, https://, or data:`,
                });
              }
            } catch (e) {
              errors.push({
                field,
                message: `Field '${field}' must be a valid URL`,
              });
            }
          }
        }
      }

      if (errors.length > 0) {
        console.log("Validation errors:", errors);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      console.log("Validation passed");
      next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during validation",
      });
    }
  };
};

export default validate;
