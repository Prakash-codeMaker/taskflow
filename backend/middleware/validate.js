/**
 * Validation Middleware
 * Joi schema validation
 */

const { AppError } = require('../utils/errorUtils');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join('. ');
      return next(new AppError(messages, 422));
    }

    // Replace with sanitized/validated values
    req[property] = value;
    next();
  };
};

module.exports = { validate };
