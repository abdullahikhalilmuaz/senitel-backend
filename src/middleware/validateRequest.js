const ApiError = require('../utils/ApiError');

// Supports a validator function returning true / false, or an object with
// validate(value) that returns { error } in Joi's familiar shape.
module.exports = (schema, source = 'body') => (req, res, next) => {
  try {
    if (!schema) return next(new ApiError(500, 'Validation schema is not configured'));
    const value = req[source];
    if (typeof schema === 'function') {
      const result = schema(value);
      if (result === true || result == null) return next();
      return next(new ApiError(400, typeof result === 'string' ? result : 'Invalid request payload'));
    }
    if (typeof schema.validate === 'function') {
      const { error, value: validatedValue } = schema.validate(value, { abortEarly: true, stripUnknown: false });
      if (error) return next(new ApiError(400, error.details?.[0]?.message || 'Invalid request payload'));
      req[source] = validatedValue;
      return next();
    }
    return next(new ApiError(500, 'Unsupported validation schema'));
  } catch (error) {
    return next(error);
  }
};
