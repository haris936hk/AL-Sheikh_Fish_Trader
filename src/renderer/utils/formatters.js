import i18n from '../i18n';

/**
 * Formatters Utility Module
 * Pakistani locale-specific formatting functions for currency, dates, weights, phone, NIC
 * Implements requirements FR-DATA-001 through FR-DATA-008
 */

/**
 * Format currency amount with Pakistani Rupee symbol
 * @param {number|string} amount - Amount to format
 * @param {Object} options - Formatting options
 * @param {string} options.symbol - Currency symbol (default: localized 'common.rs')
 * @param {number} options.decimals - Decimal places (default: 0)
 * @param {boolean} options.showSymbol - Show currency symbol (default: true)
 * @returns {string} Formatted currency string (e.g., "Rs. 1,234" or "1,234 روپے")
 */
export function formatCurrency(amount, options = {}, t = i18n.t) {
  const isUrdu = i18n.language === 'ur';
  const { symbol = t('common.rs'), decimals = 0, showSymbol = true } = options;

  if (amount === null || amount === undefined || amount === '') {
    return showSymbol ? (isUrdu ? `0 ${symbol}` : `${symbol} 0`) : '0';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return showSymbol ? (isUrdu ? `0 ${symbol}` : `${symbol} 0`) : '0';
  }

  // Format with thousand separators and decimal places
  const formatted = num.toLocaleString(isUrdu ? 'ur-PK' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (!showSymbol) return formatted;
  return isUrdu ? `${formatted} ${symbol}` : `${symbol} ${formatted}`;
}

/**
 * Format weight in kilograms with decimal precision
 * @param {number|string} weight - Weight in kg
 * @param {Object} options - Formatting options
 * @param {number} options.decimals - Decimal places (default: 3)
 * @param {boolean} options.showUnit - Show unit (default: true)
 * @returns {string} Formatted weight string (e.g., "25.500 kg" or "25.500 کلو")
 */
export function formatWeight(weight, options = {}, t = i18n.t) {
  const { decimals = 3, showUnit = true } = options;
  const unit = t('common.kg');

  if (weight === null || weight === undefined || weight === '') {
    const zero = (0).toFixed(decimals);
    return showUnit ? `${zero} ${unit}` : zero;
  }

  const num = typeof weight === 'string' ? parseFloat(weight) : weight;

  if (isNaN(num)) {
    const zero = (0).toFixed(decimals);
    return showUnit ? `${zero} ${unit}` : zero;
  }

  const formatted = num.toFixed(decimals);
  return showUnit ? `${formatted} ${unit}` : formatted;
}

/**
 * Format date according to Pakistani locale
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: 'DD-MM-YYYY', 'DD/Mon/YYYY', 'YYYY-MM-DD', 'display'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'DD-MM-YYYY', t = i18n.t) {
  if (!date) return '';

  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  const isUrdu = i18n.language === 'ur';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  // Localized months from translation files
  const getMonthName = (monthIdx) => {
    const months = t('common.months', { returnObjects: true });
    if (Array.isArray(months) && months[monthIdx]) {
      return months[monthIdx];
    }
    // Fallback if translation is missing or not an array
    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return enMonths[monthIdx];
  };

  const monthName = getMonthName(d.getMonth());

  switch (format) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'DD/Mon/YYYY':
    case 'display':
      return isUrdu ? `${day} ${monthName} ${year}` : `${day}/${monthName}/${year}`;
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

  return value.toLocaleString(i18n.language === 'ur' ? 'ur-PK' : 'en-US', {
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
export function formatPercentage(value, decimals = 2, t = i18n.t) {
  if (value === null || value === undefined || value === '') {
    return '0.00%';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '0.00%';
  }

  const symbol = t('common.pct') || '%';
  return `${num.toFixed(decimals)}${symbol}`;
}

/**
 * Parse currency string to number
 * @param {string} currencyString - Formatted currency string
 * @returns {number} Numeric value
 */
export function parseCurrency(currencyString) {
  if (!currencyString) return 0;

  // Remove currency symbols (en/ur), thousand separators, and whitespace
  // Rs. روپے are common. We also remove anything that's not a digit, dot, or minus sign
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  const value = parseFloat(cleaned);

  return isNaN(value) ? 0 : Math.round(value);
}

/**
 * Parse weight string to number
 * @param {string} weightString - Formatted weight string
 * @returns {number} Numeric value in kg
 */
export function parseWeight(weightString) {
  if (!weightString) return 0;

  // Remove non-numeric characters except dot and minus
  const cleaned = weightString.replace(/[^\d.-]/g, '');
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
