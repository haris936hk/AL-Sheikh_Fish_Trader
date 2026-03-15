import i18n from '../i18n';

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
export function validateRequired(value, fieldName, t = i18n.t) {
  const name = fieldName || t('common.field');
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: t('validation.required', { field: name }) };
  }
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: t('validation.required', { field: name }) };
  }
  return { isValid: true };
}

/**
 * Validate Pakistani phone number format
 * @param {string} phone - Phone number to validate
 * @param {boolean} required - Whether the field is required (default: false)
 * @returns {ValidationResult}
 */
export function validatePhone(phone, required = false, t = i18n.t) {
  if (!phone || phone.trim() === '') {
    if (required) {
      return { isValid: false, error: t('validation.required', { field: t('common.contact') }) };
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
    error: t('validation.invalidPhone'),
  };
}

/**
 * Validate Pakistani NIC format
 * @param {string} nic - NIC number to validate
 * @param {boolean} required - Whether the field is required (default: false)
 * @returns {ValidationResult}
 */
export function validateNIC(nic, required = false, t = i18n.t) {
  if (!nic || nic.trim() === '') {
    if (required) {
      return { isValid: false, error: t('validation.required', { field: t('common.nic') || 'NIC' }) };
    }
    return { isValid: true };
  }

  // Check for strict format: 13 digits OR 5-7-1 format
  const nicPattern = /^(\d{13}|\d{5}-\d{7}-\d{1})$/;
  if (!nicPattern.test(nic)) {
    return {
      isValid: false,
      error: t('validation.invalidNIC'),
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
export function validateEmail(email, required = false, t = i18n.t) {
  if (!email || email.trim() === '') {
    if (required) {
      return { isValid: false, error: t('validation.required', { field: t('common.email') || 'Email' }) };
    }
    return { isValid: true };
  }

  // Standard email regex pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return {
      isValid: false,
      error: t('validation.invalidEmail'),
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
export function validateDateRange(fromDate, toDate, t = i18n.t) {
  if (!fromDate || !toDate) {
    return { isValid: true }; // Optional dates
  }

  const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
  const to = toDate instanceof Date ? toDate : new Date(toDate);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return { isValid: false, error: t('validation.invalidDate') };
  }

  if (from > to) {
    return { isValid: false, error: t('validation.dateRange') };
  }

  return { isValid: true };
}

/**
 * Validate date is not in the future
 * @param {Date|string} date - Date to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateNotFutureDate(date, fieldName, t = i18n.t) {
  if (!date) {
    return { isValid: true };
  }

  const name = fieldName || t('common.date');
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  if (d > today) {
    return { isValid: false, error: t('validation.dateFuture', { field: name }) };
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
export function validatePositiveNumber(value, fieldName, allowZero = true, t = i18n.t) {
  if (value === null || value === undefined || value === '') {
    return { isValid: true }; // Empty is valid (use validateRequired for required check)
  }

  const name = fieldName || t('common.amount');
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: t('validation.notNumber', { field: name }) };
  }

  if (allowZero && num < 0) {
    return { isValid: false, error: t('validation.negative', { field: name }) };
  }

  if (!allowZero && num <= 0) {
    return { isValid: false, error: t('validation.greaterThanZero', { field: name }) };
  }

  return { isValid: true };
}

/**
 * Validate single date is valid
 * @param {Date|string} date - Date to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateDate(date, fieldName, t = i18n.t) {
  if (!date) {
    return { isValid: true };
  }
  const name = fieldName || t('common.date');
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return { isValid: false, error: t('validation.invalidDate', { field: name }) };
  }
  return { isValid: true };
}

/**
 * Validate integer
 * @param {number|string} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateInteger(value, fieldName, t = i18n.t) {
  if (value === null || value === undefined || value === '') {
    return { isValid: true };
  }
  const name = fieldName || t('common.number');
  const num = Number(value);
  if (!Number.isInteger(num)) {
    return { isValid: false, error: t('validation.notInteger', { field: name }) };
  }
  return { isValid: true };
}

/**
 * Validate non-empty array
 * @param {Array} arr - Array to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateNonEmptyArray(arr, fieldName, t = i18n.t) {
  const name = fieldName || t('common.items');
  if (!Array.isArray(arr) || arr.length === 0) {
    return { isValid: false, error: t('validation.addItem', { field: name }) };
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
export function validateLength(value, options = {}, t = i18n.t) {
  const { min, max, fieldName } = options;
  const name = fieldName || t('common.field');

  if (!value) {
    return { isValid: true }; // Empty is valid (use validateRequired for required check)
  }

  if (min && value.length < min) {
    return { isValid: false, error: t('validation.atLeastChars', { field: name, min }) };
  }

  if (max && value.length > max) {
    return { isValid: false, error: t('validation.atMostChars', { field: name, max }) };
  }

  return { isValid: true };
}

/**
 * Validate percentage (0-100)
 * @param {number|string} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validatePercentage(value, fieldName, t = i18n.t) {
  if (value === null || value === undefined || value === '') {
    return { isValid: true };
  }

  const name = fieldName || t('common.pct') || 'Percentage';
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: t('validation.notNumber', { field: name }) };
  }

  if (num < 0 || num > 100) {
    return { isValid: false, error: t('validation.betweenZeroHundred', { field: name }) };
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
