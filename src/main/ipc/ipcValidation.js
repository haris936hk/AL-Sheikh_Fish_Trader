/**
 * ipcValidation.js
 * Centralized backend validation module for IPC arguments.
 * Ensures data integrity and security before processing database operations.
 */

// Basic Type Assertions
const assertType = (value, type, fieldName) => {
    if (type === 'array') {
        if (!Array.isArray(value)) throw new Error(`Invalid type: ${fieldName} must be an array`);
    } else if (type === 'integer') {
        if (!Number.isInteger(value)) throw new Error(`Invalid type: ${fieldName} must be an integer`);
    } else if (typeof value !== type) {
        throw new Error(`Invalid type: ${fieldName} must be a ${type}`);
    }
};

const assertRequired = (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
        throw new Error(`Required field missing: ${fieldName}`);
    }
};

const assertInteger = (value, fieldName) => {
    assertType(value, 'integer', fieldName);
};

const assertDateString = (value, fieldName) => {
    assertType(value, 'string', fieldName);
    const dateStr = value.split('T')[0]; // Handle cases where time might be appended
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // allow simple YYYY-MM-DD
    } else {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date format: ${fieldName} must be a valid date string`);
        }
    }
};

const assertNonEmptyArray = (value, fieldName) => {
    assertType(value, 'array', fieldName);
    if (value.length === 0) {
        throw new Error(`Array cannot be empty: ${fieldName}`);
    }
};

const assertNumericRange = (value, min, max, fieldName) => {
    assertType(value, 'number', fieldName);
    if ((min !== null && value < min) || (max !== null && value > max)) {
        throw new Error(`Value out of range: ${fieldName} must be between ${min} and ${max}`);
    }
};

const assertStringLength = (value, min, max, fieldName) => {
    if (value === null || value === undefined) return; // Allow nulls if not explicitly required
    assertType(value, 'string', fieldName);
    const len = value.trim().length;
    if ((min !== null && len < min) || (max !== null && len > max)) {
        throw new Error(`Invalid length: ${fieldName} must be between ${min} and ${max} characters`);
    }
};


const sanitizeString = (value) => {
    if (typeof value !== 'string') return value;
    // eslint-disable-next-line no-control-regex
    return value.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
};

// Composite Validators

const validateSupplierData = (data) => {
    try {
        assertType(data, 'object', 'supplier data');
        if (!data.name && !data.name_english) {
            throw new Error('Supplier must have at least an Urdu or English name');
        }
        if (data.name) assertStringLength(data.name, 1, 100, 'name');
        if (data.name_english) assertStringLength(data.name_english, 1, 100, 'name_english');
        if (data.nic) assertStringLength(data.nic, 15, 15, 'nic');

        if (data.default_commission_pct !== undefined && data.default_commission_pct !== null) {
            assertNumericRange(data.default_commission_pct, 0, 100, 'default_commission_pct');
        }
        return { valid: true, data: sanitizeObjectStrings(data) };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

const validateCustomerData = (data) => {
    try {
        assertType(data, 'object', 'customer data');
        if (!data.name && !data.name_english) {
            throw new Error('Customer must have at least an Urdu or English name');
        }
        if (data.name) assertStringLength(data.name, 1, 100, 'name');
        if (data.name_english) assertStringLength(data.name_english, 1, 100, 'name_english');
        if (data.nic) assertStringLength(data.nic, 15, 15, 'nic');

        return { valid: true, data: sanitizeObjectStrings(data) };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

const validateItemData = (data) => {
    try {
        assertType(data, 'object', 'item data');
        assertRequired(data.name, 'name');
        assertStringLength(data.name, 2, 100, 'name');
        if (data.name_english) assertStringLength(data.name_english, 1, 100, 'name_english');

        if (data.unit_price !== undefined && data.unit_price !== null) {
            assertNumericRange(data.unit_price, 0, null, 'unit_price');
        }
        return { valid: true, data: sanitizeObjectStrings(data) };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

const validateSaleData = (data) => {
    try {
        assertType(data, 'object', 'sale data');
        assertRequired(data.sale_date, 'sale_date');
        assertDateString(data.sale_date, 'sale_date');

        if (data.customer_id) assertInteger(data.customer_id, 'customer_id');
        if (data.supplier_id) assertInteger(data.supplier_id, 'supplier_id');

        assertNonEmptyArray(data.items, 'items');

        data.items.forEach((item, index) => {
            assertRequired(item.item_id, `items[${index}].item_id`);
            assertInteger(item.item_id, `items[${index}].item_id`);

            assertRequired(item.weight, `items[${index}].weight`);
            assertNumericRange(item.weight, 0.0001, null, `items[${index}].weight`); // > 0

            assertRequired(item.rate, `items[${index}].rate`);
            assertNumericRange(item.rate, 0.0001, null, `items[${index}].rate`); // > 0
        });

        return { valid: true, data: sanitizeObjectStrings(data) };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

const validatePurchaseData = (data) => {
    try {
        assertType(data, 'object', 'purchase data');
        assertRequired(data.supplier_id, 'supplier_id');
        assertInteger(data.supplier_id, 'supplier_id');

        assertRequired(data.purchase_date, 'purchase_date');
        assertDateString(data.purchase_date, 'purchase_date');

        assertNonEmptyArray(data.items, 'items');

        data.items.forEach((item, index) => {
            assertRequired(item.item_id, `items[${index}].item_id`);
            assertInteger(item.item_id, `items[${index}].item_id`);

            assertRequired(item.weight, `items[${index}].weight`);
            assertNumericRange(item.weight, 0.0001, null, `items[${index}].weight`); // > 0

            assertRequired(item.rate, `items[${index}].rate`);
            assertNumericRange(item.rate, 0.0001, null, `items[${index}].rate`); // > 0
        });

        return { valid: true, data: sanitizeObjectStrings(data) };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

const validateSupplierBillData = (data) => {
    try {
        assertType(data, 'object', 'supplier bill data');
        assertRequired(data.supplier_id, 'supplier_id');
        assertInteger(data.supplier_id, 'supplier_id');

        assertRequired(data.date_from, 'date_from');
        assertDateString(data.date_from, 'date_from');

        assertRequired(data.date_to, 'date_to');
        assertDateString(data.date_to, 'date_to');

        if (new Date(data.date_from) > new Date(data.date_to)) {
            throw new Error('date_from cannot be after date_to');
        }

        const amountFields = [
            'total_weight', 'gross_amount', 'drugs_charges', 'fare_charges',
            'labor_charges', 'ice_charges', 'other_charges', 'concession_amount', 'cash_paid'
        ];

        amountFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== null) {
                assertNumericRange(data[field], 0, null, field);
            }
        });

        if (data.commission_pct !== undefined && data.commission_pct !== null) {
            assertNumericRange(data.commission_pct, 0, 100, 'commission_pct');
        }

        return { valid: true, data: sanitizeObjectStrings(data) };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

const validateSettingsKey = (key) => {
    const allowedKeys = [
        'app_name', 'app_theme', 'app_language', 'company_name',
        'company_address', 'company_phone', 'receipt_footer',
        'default_commission_pct', 'backup_path', 'backup_frequency',
        'tax_rate', 'currency'
    ]; // Add all valid keys here based on schema defaults

    if (!allowedKeys.includes(key)) {
        return { valid: false, error: `Invalid setting key: ${key}` };
    }
    return { valid: true };
}

// Helper
const sanitizeObjectStrings = (obj) => {
    const sanitized = { ...obj };
    for (const key in sanitized) {
        if (typeof sanitized[key] === 'string') {
            sanitized[key] = sanitizeString(sanitized[key]);
        }
    }
    return sanitized;
};

module.exports = {
    assertInteger,
    assertDateString,
    validateSupplierData,
    validateCustomerData,
    validateItemData,
    validateSaleData,
    validatePurchaseData,
    validateSupplierBillData,
    validateSettingsKey,
    sanitizeString
};
