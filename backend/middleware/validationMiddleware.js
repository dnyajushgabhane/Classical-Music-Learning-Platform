const { body, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

// Common validation rules
const validateObjectId = (field) => body(field).isMongoId().withMessage(`${field} must be a valid ObjectId`);

const validateRequiredString = (field, maxLength = 1000) =>
  body(field)
    .isString()
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${field} is required and must be between 1 and ${maxLength} characters`);

const validateOptionalString = (field, maxLength = 1000) =>
  body(field)
    .optional()
    .isString()
    .trim()
    .isLength({ min: 0, max: maxLength })
    .withMessage(`${field} must be less than ${maxLength} characters`);

const validateEmail = (field) =>
  body(field)
    .isEmail()
    .normalizeEmail()
    .withMessage(`${field} must be a valid email address`);

const validateBoolean = (field) =>
  body(field)
    .optional()
    .isBoolean()
    .withMessage(`${field} must be a boolean value`);

const validateDate = (field) =>
  body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid ISO date`);

const validatePositiveInteger = (field) =>
  body(field)
    .optional()
    .isInt({ min: 1 })
    .withMessage(`${field} must be a positive integer`);

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validateRequiredString,
  validateOptionalString,
  validateEmail,
  validateBoolean,
  validateDate,
  validatePositiveInteger,
};