/**
 * Formatters Utility Module
 * Pakistani locale-specific formatting functions for currency, dates, weights, phone, NIC
 * Implements requirements FR-DATA-001 through FR-DATA-008
 */

/**
 * Format currency amount with Pakistani Rupee symbol
 * @param {number|string} amount - Amount to format
 * @param {Object} options - Formatting options
 * @param {string} options.symbol - Currency symbol (default: 'Rs.')
 * @param {number} options.decimals - Decimal places (default: 2)
 * @param {boolean} options.showSymbol - Show currency symbol (default: true)
 * @returns {string} Formatted currency string (e.g., "Rs. 1,234.56")
 */
export function formatCurrency(amount, options = {}) {
  const { symbol = 'Rs.', decimals = 2, showSymbol = true } = options;

  if (amount === null || amount === undefined || amount === '') {
    return showSymbol ? `${symbol} 0.00` : '0.00';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return showSymbol ? `${symbol} 0.00` : '0.00';
  }

  // Format with thousand separators and decimal places
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `${symbol} ${formatted}` : formatted;
}

/**
 * Format weight in kilograms with decimal precision
 * @param {number|string} weight - Weight in kg
 * @param {Object} options - Formatting options
 * @param {number} options.decimals - Decimal places (default: 3)
 * @param {boolean} options.showUnit - Show kg unit (default: true)
 * @returns {string} Formatted weight string (e.g., "25.500 kg")
 */
export function formatWeight(weight, options = {}) {
  const { decimals = 3, showUnit = true } = options;

  if (weight === null || weight === undefined || weight === '') {
    return showUnit ? '0.000 kg' : '0.000';
  }

  const num = typeof weight === 'string' ? parseFloat(weight) : weight;

  if (isNaN(num)) {
    return showUnit ? '0.000 kg' : '0.000';
  }

  const formatted = num.toFixed(decimals);
  return showUnit ? `${formatted} kg` : formatted;
}

/**
 * Format date according to Pakistani locale
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: 'DD-MM-YYYY', 'DD/Mon/YYYY', 'YYYY-MM-DD', 'display'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'DD-MM-YYYY') {
  if (!date) return '';

  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthName = monthNames[d.getMonth()];

  switch (format) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'DD/Mon/YYYY':
    case 'display':
      return `${day}/${monthName}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    default:
      return `${day}-${month}-${year}`;
  }
}

/**
 * Format phone number in Pakistani format
 * @param {string} phone - Phone number to format
 * @param {boolean} addDashes - Add dashes for readability (default: false)
 * @returns {string} Formatted phone number (e.g., "03001234567" or "0300-1234567")
 */
export function formatPhone(phone) {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Handle different phone formats
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // Pakistani mobile: 03XXXXXXXXX
    return cleaned;
  } else if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    // Missing leading zero
    return `0${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('92')) {
    // International format +92 -> convert to local
    return `0${cleaned.slice(2)}`;
  }

  return cleaned;
}

/**
 * Format Pakistani NIC number
 * @param {string} nic - NIC number to format
 * @returns {string} Formatted NIC (e.g., "12345-1234567-1")
 */
export function formatNIC(nic) {
  if (!nic) return '';

  // Remove all non-digit characters
  const cleaned = nic.replace(/\D/g, '');

  if (cleaned.length === 13) {
    // Format as XXXXX-XXXXXXX-X
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
  }

  return nic;
}

/**
 * Format number with thousand separators
 * @param {number|string} num - Number to format
 * @param {number} decimals - Decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || num === '') {
    return '0';
  }

  const value = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(value)) {
    return '0';
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format percentage
 * @param {number|string} value - Value to format as percentage
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted percentage (e.g., "5.50%")
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined || value === '') {
    return '0.00%';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '0.00%';
  }

  return `${num.toFixed(decimals)}%`;
}

/**
 * Parse currency string to number
 * @param {string} currencyString - Formatted currency string
 * @returns {number} Numeric value
 */
export function parseCurrency(currencyString) {
  if (!currencyString) return 0;

  // Remove currency symbol and thousand separators
  const cleaned = currencyString.replace(/[Rs.\s,]/g, '');
  const value = parseFloat(cleaned);

  return isNaN(value) ? 0 : value;
}

/**
 * Parse weight string to number
 * @param {string} weightString - Formatted weight string
 * @returns {number} Numeric value in kg
 */
export function parseWeight(weightString) {
  if (!weightString) return 0;

  // Remove 'kg' and whitespace
  const cleaned = weightString.replace(/kg/gi, '').trim();
  const value = parseFloat(cleaned);

  return isNaN(value) ? 0 : value;
}

/**
 * Format date for API/database (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} ISO date string
 */
export function formatDateForAPI(date) {
  if (!date) return null;

  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString().split('T')[0];
}

/**
 * Get today's date formatted for API
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export function getTodayForAPI() {
  return formatDateForAPI(new Date());
}

/**
 * Format display name with optional English code
 * @param {string} urduName - Primary Urdu name
 * @param {string} englishName - Optional English name/code
 * @returns {string} Combined display name
 */
export function formatDisplayName(urduName, englishName, isUr = true) {
  if (!urduName && !englishName) return '';
  if (isUr) return urduName || englishName;
  return englishName || urduName;
}
