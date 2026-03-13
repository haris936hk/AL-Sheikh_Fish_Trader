/**
 * Validators Utility Module
 * Validation functions for data integrity
 * Implements requirements FR-VALID-001 through FR-VALID-010
 */

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string} [error] - Error message if validation failed
 */

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateRequired(value, fieldName = 'This field') {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
}

/**
 * Validate Pakistani phone number format
 * @param {string} phone - Phone number to validate
 * @param {boolean} required - Whether the field is required (default: false)
 * @returns {ValidationResult}
 */
export function validatePhone(phone, required = false) {
  if (!phone || phone.trim() === '') {
    if (required) {
      return { isValid: false, error: 'Phone number is required' };
    }
    return { isValid: true };
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check for valid Pakistani mobile format (03XXXXXXXXX)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // Valid Pakistani mobile
    if (/^03[0-9]{9}$/.test(cleaned)) {
      return { isValid: true };
    }
    // Valid Pakistani landline (0XX-XXXXXXX)
    return { isValid: true };
  }

  // Check for +92 format
  if (cleaned.length === 12 && cleaned.startsWith('92')) {
    return { isValid: true };
  }

  // Check for 10-digit format (missing leading zero)
  if (cleaned.length === 10 && /^3[0-9]{9}$/.test(cleaned)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'Invalid phone format. Use Pakistani format (e.g., 03001234567)',
  };
}

/**
 * Validate Pakistani NIC format
 * @param {string} nic - NIC number to validate
 * @param {boolean} required - Whether the field is required (default: false)
 * @returns {ValidationResult}
 */
export function validateNIC(nic, required = false) {
  if (!nic || nic.trim() === '') {
    if (required) {
      return { isValid: false, error: 'NIC number is required' };
    }
    return { isValid: true };
  }

  // Check for strict format: 13 digits OR 5-7-1 format
  const nicPattern = /^(\d{13}|\d{5}-\d{7}-\d{1})$/;
  if (!nicPattern.test(nic)) {
    return {
      isValid: false,
      error: 'Invalid NIC format. Use 13 digits or XXXXX-XXXXXXX-X format',
    };
  }

  return { isValid: true };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @param {boolean} required - Whether the field is required (default: false)
 * @returns {ValidationResult}
 */
export function validateEmail(email, required = false) {
  if (!email || email.trim() === '') {
    if (required) {
      return { isValid: false, error: 'Email is required' };
    }
    return { isValid: true };
  }

  // Standard email regex pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  return { isValid: true };
}

/**
 * Validate date range (from date should be before or equal to to date)
 * @param {Date|string} fromDate - Start date
 * @param {Date|string} toDate - End date
 * @returns {ValidationResult}
 */
export function validateDateRange(fromDate, toDate) {
  if (!fromDate || !toDate) {
    return { isValid: true }; // Optional dates
  }

  const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
  const to = toDate instanceof Date ? toDate : new Date(toDate);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  if (from > to) {
    return { isValid: false, error: 'From date cannot be later than To date' };
  }

  return { isValid: true };
}

/**
 * Validate date is not in the future
 * @param {Date|string} date - Date to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateNotFutureDate(date, fieldName = 'Date') {
  if (!date) {
    return { isValid: true };
  }

  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  if (d > today) {
    return { isValid: false, error: `${fieldName} cannot be in the future` };
  }

  return { isValid: true };
}

/**
 * Validate positive number (greater than or equal to zero)
 * @param {number|string} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @param {boolean} allowZero - Whether zero is allowed (default: true)
 * @returns {ValidationResult}
 */
export function validatePositiveNumber(value, fieldName = 'Value', allowZero = true) {
  if (value === null || value === undefined || value === '') {
    return { isValid: true }; // Empty is valid (use validateRequired for required check)
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (allowZero && num < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }

  if (!allowZero && num <= 0) {
    return { isValid: false, error: `${fieldName} must be greater than zero` };
  }

  return { isValid: true };
}

/**
 * Validate single date is valid
 * @param {Date|string} date - Date to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateDate(date, fieldName = 'Date') {
  if (!date) {
    return { isValid: true };
  }
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return { isValid: false, error: `${fieldName} is an invalid date` };
  }
  return { isValid: true };
}

/**
 * Validate integer
 * @param {number|string} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateInteger(value, fieldName = 'Value') {
  if (value === null || value === undefined || value === '') {
    return { isValid: true };
  }
  const num = Number(value);
  if (!Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} must be a whole number` };
  }
  return { isValid: true };
}

/**
 * Validate non-empty array
 * @param {Array} arr - Array to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateNonEmptyArray(arr, fieldName = 'List') {
  if (!Array.isArray(arr) || arr.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }
  return { isValid: true };
}

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {Object} options - Validation options
 * @param {number} [options.min] - Minimum length
 * @param {number} [options.max] - Maximum length
 * @param {string} [options.fieldName] - Field name for error message
 * @returns {ValidationResult}
 */
export function validateLength(value, options = {}) {
  const { min, max, fieldName = 'Field' } = options;

  if (!value) {
    return { isValid: true }; // Empty is valid (use validateRequired for required check)
  }

  if (min && value.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters` };
  }

  if (max && value.length > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max} characters` };
  }

  return { isValid: true };
}

/**
 * Validate percentage (0-100)
 * @param {number|string} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validatePercentage(value, fieldName = 'Percentage') {
  if (value === null || value === undefined || value === '') {
    return { isValid: true };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < 0 || num > 100) {
    return { isValid: false, error: `${fieldName} must be between 0 and 100` };
  }

  return { isValid: true };
}

/**
 * Validate form data with multiple rules
 * @param {Object} data - Form data object
 * @param {Object} rules - Validation rules { fieldName: [validators] }
 * @returns {Object} { isValid: boolean, errors: { fieldName: errorMessage } }
 */
export function validateForm(data, rules) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, validators] of Object.entries(rules)) {
    const value = data[fieldName];

    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        errors[fieldName] = result.error;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }

  return { isValid, errors };
}

/**
 * Create a required validator with custom field name
 * @param {string} fieldName - Field name for error message
 * @returns {Function} Validator function
 */
export function required(fieldName) {
  return (value) => validateRequired(value, fieldName);
}

/**
 * Create a min length validator
 * @param {number} min - Minimum length
 * @param {string} fieldName - Field name for error message
 * @returns {Function} Validator function
 */
export function minLength(min, fieldName) {
  return (value) => validateLength(value, { min, fieldName });
}

/**
 * Create a max length validator
 * @param {number} max - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {Function} Validator function
 */
export function maxLength(max, fieldName) {
  return (value) => validateLength(value, { max, fieldName });
}

/**
 * Create a positive number validator
 * @param {string} fieldName - Field name for error message
 * @param {boolean} allowZero - Whether zero is allowed
 * @returns {Function} Validator function
 */
export function positiveNumber(fieldName, allowZero = true) {
  return (value) => validatePositiveNumber(value, fieldName, allowZero);
}

/**
 * Create a percentage validator
 * @param {string} fieldName - Field name for error message
 * @returns {Function} Validator function
 */
export function percentage(fieldName) {
  return (value) => validatePercentage(value, fieldName);
}
