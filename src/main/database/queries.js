const db = require('./index.js');

/**
 * Common database queries with prepared statements
 * Prevents SQL injection and improves performance
 */

// Settings queries
const settings = {
  getAll: () => {
    return db.query('SELECT * FROM settings ORDER BY key');
  },

  get: (key) => {
    const result = db.query('SELECT value FROM settings WHERE key = ?', [key]);
    return result[0]?.value || null;
  },

  set: (key, value) => {
    return db.execute(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
      [key, value, value]
    );
  },

  delete: (key) => {
    return db.execute('DELETE FROM settings WHERE key = ?', [key]);
  },
};

// Dashboard queries
const dashboard = {
  /**
   * Get suppliers with non-zero advance amounts
   * @returns {Array} Suppliers with id, name, and advance_amount
   */
  getSupplierAdvances: () => {
    return db.query(
      `SELECT id, name, name_english, advance_amount 
       FROM suppliers 
       WHERE advance_amount > 0 AND is_active = 1
       ORDER BY name ASC`
    );
  },

  /**
   * Get items with current stock levels
   * @returns {Array} Items with id, name, current_stock, and category
   */
  getItemsStock: () => {
    return db.query(
      `SELECT i.id, i.name, i.name_english, i.current_stock, i.unit_price,
              c.name as category_name, c.name_urdu as category_name_urdu
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.is_active = 1
       ORDER BY i.name ASC`
    );
  },

  /**
   * Get dashboard summary statistics
   * @returns {Object} Summary with counts and totals
   */
  getSummary: () => {
    const suppliersResult = db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(advance_amount), 0) as total_advances FROM suppliers WHERE is_active = 1'
    );
    const customersResult = db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(current_balance), 0) as total_balance FROM customers WHERE is_active = 1'
    );
    const itemsResult = db.query('SELECT COUNT(*) as count FROM items WHERE is_active = 1');
    const todaySalesResult = db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(net_amount), 0) as total 
       FROM sales 
       WHERE DATE(sale_date) = DATE('now', 'localtime')`
    );

    return {
      suppliers: suppliersResult[0] || { count: 0, total_advances: 0 },
      customers: customersResult[0] || { count: 0, total_balance: 0 },
      items: itemsResult[0] || { count: 0 },
      todaySales: todaySalesResult[0] || { count: 0, total: 0 },
    };
  },
};

// Supplier queries
const suppliers = {
  /**
   * Get all active suppliers with city/country names
   * @returns {Array} Suppliers with joined city/country data
   */
  getAll: () => {
    return db.query(
      `SELECT s.*, 
              c.name as city_name, c.name_urdu as city_name_urdu,
              co.name as country_name, co.name_urdu as country_name_urdu
       FROM suppliers s
       LEFT JOIN cities c ON s.city_id = c.id
       LEFT JOIN countries co ON s.country_id = co.id
       WHERE s.is_active = 1
       ORDER BY s.name ASC`
    );
  },

  /**
   * Get supplier by ID with joined data
   * @param {number} id - Supplier ID
   * @returns {Object|null} Supplier object or null
   */
  getById: (id) => {
    const result = db.query(
      `SELECT s.*, 
              c.name as city_name, c.name_urdu as city_name_urdu,
              co.name as country_name, co.name_urdu as country_name_urdu
       FROM suppliers s
       LEFT JOIN cities c ON s.city_id = c.id
       LEFT JOIN countries co ON s.country_id = co.id
       WHERE s.id = ?`,
      [id]
    );
    return result[0] || null;
  },

  /**
   * Search suppliers by name (partial match)
   * @param {string} name - Search term
   * @returns {Array} Matching suppliers
   */
  search: (name) => {
    const searchTerm = `%${name}%`;
    return db.query(
      `SELECT s.*, 
              c.name as city_name, c.name_urdu as city_name_urdu,
              co.name as country_name, co.name_urdu as country_name_urdu
       FROM suppliers s
       LEFT JOIN cities c ON s.city_id = c.id
       LEFT JOIN countries co ON s.country_id = co.id
       WHERE s.is_active = 1 AND (s.name LIKE ? OR s.name_english LIKE ?)
       ORDER BY s.name ASC`,
      [searchTerm, searchTerm]
    );
  },

  /**
   * Check if NIC already exists (for validation)
   * @param {string} nic - NIC number to check
   * @param {number|null} excludeId - Supplier ID to exclude (for updates)
   * @returns {boolean} True if NIC exists
   */
  checkNic: (nic, excludeId = null) => {
    if (!nic || nic.trim() === '') return false;

    const query = excludeId
      ? 'SELECT COUNT(*) as count FROM suppliers WHERE nic = ? AND id != ? AND is_active = 1'
      : 'SELECT COUNT(*) as count FROM suppliers WHERE nic = ? AND is_active = 1';

    const params = excludeId ? [nic, excludeId] : [nic];
    const result = db.query(query, params);
    return result[0]?.count > 0;
  },

  /**
   * Create a new supplier
   * @param {Object} data - Supplier data
   * @returns {Object} Insert result with lastInsertRowid
   */
  create: (data) => {
    const {
      name,
      name_english,
      nic,
      phone,
      mobile,
      email,
      address,
      city_id,
      country_id,
      opening_balance,
      default_commission_pct,
      notes,
      created_by,
    } = data;

    return db.execute(
      `INSERT INTO suppliers (
        name, name_english, nic, phone, mobile, email,
        address, city_id, country_id, opening_balance,
        current_balance, default_commission_pct, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        name_english || null,
        nic || null,
        phone || null,
        mobile || null,
        email || null,
        address || null,
        city_id || null,
        country_id || null,
        opening_balance || 0,
        opening_balance || 0,
        default_commission_pct || 5.0,
        notes || null,
        created_by || null,
      ]
    );
  },

  /**
   * Update an existing supplier
   * @param {number} id - Supplier ID
   * @param {Object} data - Updated supplier data
   * @returns {Object} Update result
   */
  update: (id, data) => {
    const {
      name,
      name_english,
      nic,
      phone,
      mobile,
      email,
      address,
      city_id,
      country_id,
      default_commission_pct,
      notes,
    } = data;

    return db.execute(
      `UPDATE suppliers SET
        name = ?, name_english = ?, nic = ?, phone = ?,
        mobile = ?, email = ?, address = ?, city_id = ?,
        country_id = ?, default_commission_pct = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        name_english || null,
        nic || null,
        phone || null,
        mobile || null,
        email || null,
        address || null,
        city_id || null,
        country_id || null,
        default_commission_pct || 5.0,
        notes || null,
        id,
      ]
    );
  },

  /**
   * Soft delete a supplier (set is_active = 0)
   * @param {number} id - Supplier ID
   * @returns {Object} Update result
   */
  delete: (id) => {
    return db.execute(
      `UPDATE suppliers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  },

  /**
   * Check if supplier has any transactions (prevents deletion)
   * @param {number} id - Supplier ID
   * @returns {boolean} True if supplier has transactions
   */
  hasTransactions: (id) => {
    const purchaseResult = db.query(
      'SELECT COUNT(*) as count FROM purchases WHERE supplier_id = ?',
      [id]
    );
    const saleResult = db.query('SELECT COUNT(*) as count FROM sales WHERE supplier_id = ?', [id]);
    return (purchaseResult[0]?.count || 0) > 0 || (saleResult[0]?.count || 0) > 0;
  },
};

// Customer queries
const customers = {
  /**
   * Get all active customers with city/country names
   * @returns {Array} Customers with joined city/country data
   */
  getAll: () => {
    return db.query(
      `SELECT c.*, 
              ci.name as city_name, ci.name_urdu as city_name_urdu,
              co.name as country_name, co.name_urdu as country_name_urdu
       FROM customers c
       LEFT JOIN cities ci ON c.city_id = ci.id
       LEFT JOIN countries co ON c.country_id = co.id
       WHERE c.is_active = 1
       ORDER BY c.name ASC`
    );
  },

  /**
   * Get customer by ID with joined data
   * @param {number} id - Customer ID
   * @returns {Object|null} Customer object or null
   */
  getById: (id) => {
    const result = db.query(
      `SELECT c.*, 
              ci.name as city_name, ci.name_urdu as city_name_urdu,
              co.name as country_name, co.name_urdu as country_name_urdu
       FROM customers c
       LEFT JOIN cities ci ON c.city_id = ci.id
       LEFT JOIN countries co ON c.country_id = co.id
       WHERE c.id = ?`,
      [id]
    );
    return result[0] || null;
  },

  /**
   * Search customers by name (partial match)
   * @param {string} name - Search term
   * @returns {Array} Matching customers
   */
  search: (name) => {
    const searchTerm = `%${name}%`;
    return db.query(
      `SELECT c.*, 
              ci.name as city_name, ci.name_urdu as city_name_urdu,
              co.name as country_name, co.name_urdu as country_name_urdu
       FROM customers c
       LEFT JOIN cities ci ON c.city_id = ci.id
       LEFT JOIN countries co ON c.country_id = co.id
       WHERE c.is_active = 1 AND (c.name LIKE ? OR c.name_english LIKE ?)
       ORDER BY c.name ASC`,
      [searchTerm, searchTerm]
    );
  },

  /**
   * Check if NIC already exists (for validation)
   * @param {string} nic - NIC number to check
   * @param {number|null} excludeId - Customer ID to exclude (for updates)
   * @returns {boolean} True if NIC exists
   */
  checkNic: (nic, excludeId = null) => {
    if (!nic || nic.trim() === '') return false;

    const query = excludeId
      ? 'SELECT COUNT(*) as count FROM customers WHERE nic = ? AND id != ? AND is_active = 1'
      : 'SELECT COUNT(*) as count FROM customers WHERE nic = ? AND is_active = 1';

    const params = excludeId ? [nic, excludeId] : [nic];
    const result = db.query(query, params);
    return result[0]?.count > 0;
  },

  /**
   * Create a new customer
   * @param {Object} data - Customer data
   * @returns {Object} Insert result with lastInsertRowid
   */
  create: (data) => {
    const {
      name,
      name_english,
      nic,
      phone,
      mobile,
      email,
      address,
      city_id,
      country_id,
      opening_balance,
      credit_limit,
      notes,
      created_by,
    } = data;

    return db.execute(
      `INSERT INTO customers (
        name, name_english, nic, phone, mobile, email,
        address, city_id, country_id, opening_balance,
        current_balance, credit_limit, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        name_english || null,
        nic || null,
        phone || null,
        mobile || null,
        email || null,
        address || null,
        city_id || null,
        country_id || null,
        opening_balance || 0,
        opening_balance || 0,
        credit_limit || null,
        notes || null,
        created_by || null,
      ]
    );
  },

  /**
   * Update an existing customer
   * @param {number} id - Customer ID
   * @param {Object} data - Updated customer data
   * @returns {Object} Update result
   */
  update: (id, data) => {
    const {
      name,
      name_english,
      nic,
      phone,
      mobile,
      email,
      address,
      city_id,
      country_id,
      credit_limit,
      notes,
    } = data;

    return db.execute(
      `UPDATE customers SET
        name = ?, name_english = ?, nic = ?, phone = ?,
        mobile = ?, email = ?, address = ?, city_id = ?,
        country_id = ?, credit_limit = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        name_english || null,
        nic || null,
        phone || null,
        mobile || null,
        email || null,
        address || null,
        city_id || null,
        country_id || null,
        credit_limit || null,
        notes || null,
        id,
      ]
    );
  },

  /**
   * Soft delete a customer (set is_active = 0)
   * @param {number} id - Customer ID
   * @returns {Object} Update result
   */
  delete: (id) => {
    return db.execute(
      `UPDATE customers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  },

  /**
   * Check if customer has any transactions (prevents deletion)
   * @param {number} id - Customer ID
   * @returns {boolean} True if customer has transactions
   */
  hasTransactions: (id) => {
    const saleResult = db.query('SELECT COUNT(*) as count FROM sales WHERE customer_id = ?', [id]);
    const paymentResult = db.query('SELECT COUNT(*) as count FROM payments WHERE customer_id = ?', [
      id,
    ]);
    return (saleResult[0]?.count || 0) > 0 || (paymentResult[0]?.count || 0) > 0;
  },
};

// Reference data queries
const reference = {
  /**
   * Get all active cities with country info
   * @returns {Array} Cities with country names
   */
  getCities: () => {
    return db.query(
      `SELECT c.*, co.name as country_name, co.name_urdu as country_name_urdu
       FROM cities c
       LEFT JOIN countries co ON c.country_id = co.id
       WHERE c.is_active = 1
       ORDER BY c.name ASC`
    );
  },

  /**
   * Get all active countries
   * @returns {Array} Countries
   */
  getCountries: () => {
    return db.query(`SELECT * FROM countries WHERE is_active = 1 ORDER BY name ASC`);
  },

  /**
   * Get all active categories
   * @returns {Array} Categories
   */
  getCategories: () => {
    return db.query(`SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC`);
  },
};

// Supplier Bill queries
const supplierBills = {
  /**
   * Get all supplier bills with supplier info
   * @returns {Array} Bills with supplier names
   */
  getAll: () => {
    return db.query(
      `SELECT sb.*,
              s.name as supplier_name, s.name_english as supplier_name_english
       FROM supplier_bills sb
       LEFT JOIN suppliers s ON sb.supplier_id = s.id
       WHERE sb.status != 'deleted'
       ORDER BY sb.created_at DESC`
    );
  },

  /**
   * Get bill by ID with supplier info
   * @param {number} id - Bill ID
   * @returns {Object|null} Bill object or null
   */
  getById: (id) => {
    const result = db.query(
      `SELECT sb.*,
              s.name as supplier_name, s.name_english as supplier_name_english,
              s.advance_amount as supplier_advance
       FROM supplier_bills sb
       LEFT JOIN suppliers s ON sb.supplier_id = s.id
       WHERE sb.id = ?`,
      [id]
    );
    return result[0] || null;
  },

  /**
   * Generate bill preview - fetch sales for a supplier in date range
   * @param {number} supplierId - Supplier ID
   * @param {string} dateFrom - Start date (YYYY-MM-DD)
   * @param {string} dateTo - End date (YYYY-MM-DD)
   * @returns {Object} Preview data with items and totals
   */
  generatePreview: (supplierId, dateFrom, dateTo) => {
    // Get sales items for the supplier in date range (exclude already-billed items)
    const items = db.query(
      `SELECT 
         si.id,
         si.sale_id,
         s.sale_number,
         s.sale_date,
         s.vehicle_number,
         i.name as item_name,
         i.name_english as item_name_english,
         si.weight,
         si.rate,
         si.amount
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN items i ON si.item_id = i.id
       WHERE s.supplier_id = ?
         AND DATE(s.sale_date) >= DATE(?)
         AND DATE(s.sale_date) <= DATE(?)
         AND s.status = 'posted'
         AND si.supplier_bill_id IS NULL
         AND si.is_stock = 0
       ORDER BY s.sale_date ASC, si.line_number ASC`,
      [supplierId, dateFrom, dateTo]
    );

    // Calculate totals
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
    const grossAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

    // Get supplier's default commission
    const supplier = db.query(
      'SELECT default_commission_pct, advance_amount FROM suppliers WHERE id = ?',
      [supplierId]
    );
    const defaultCommissionPct = supplier[0]?.default_commission_pct || 5.0;
    const supplierAdvance = supplier[0]?.advance_amount || 0;

    return {
      items,
      totalWeight,
      grossAmount,
      defaultCommissionPct,
      supplierAdvance,
    };
  },

  /**
   * Get next bill number from sequence
   * @returns {string} Next bill number (e.g., "BILL-000001")
   */
  getNextBillNumber: () => {
    const result = db.query(
      'SELECT prefix, current_number, number_length FROM number_sequences WHERE name = ?',
      ['supplier_bill']
    );
    if (!result[0]) {
      return 'BILL-000001';
    }
    const { prefix, current_number, number_length } = result[0];
    const nextNum = (current_number + 1).toString().padStart(number_length, '0');
    return `${prefix}${nextNum}`;
  },

  /**
   * Create a new supplier bill
   * @param {Object} data - Bill data
   * @returns {Object} Insert result with lastInsertRowid
   */
  create: (data) => {
    const {
      supplier_id,
      vehicle_number,
      date_from,
      date_to,
      total_weight,
      gross_amount,
      commission_pct,
      commission_amount,
      drugs_charges,
      fare_charges,
      labor_charges,
      ice_charges,
      other_charges,
      total_charges,
      total_payable,
      concession_amount,
      cash_paid,
      collection_amount,
      balance_amount,
      notes,
      created_by,
    } = data;

    // Get next bill number
    const billNumber = supplierBills.getNextBillNumber();

    // Insert the bill
    const result = db.execute(
      `INSERT INTO supplier_bills (
        bill_number, supplier_id, vehicle_number, date_from, date_to, total_weight, gross_amount,
        commission_pct, commission_amount, drugs_charges, fare_charges, labor_charges,
        ice_charges, other_charges, total_charges, total_payable,
        concession_amount, cash_paid, collection_amount, balance_amount,
        status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted', ?, ?)`,
      [
        billNumber,
        supplier_id,
        vehicle_number || null,
        date_from,
        date_to,
        total_weight || 0,
        gross_amount || 0,
        commission_pct || 5.0,
        commission_amount || 0,
        drugs_charges || 0,
        fare_charges || 0,
        labor_charges || 0,
        ice_charges || 0,
        other_charges || 0,
        total_charges || 0,
        total_payable || 0,
        concession_amount || 0,
        cash_paid || 0,
        collection_amount || 0,
        balance_amount || 0,
        notes || null,
        created_by || null,
      ]
    );

    // Update number sequence
    db.execute(
      'UPDATE number_sequences SET current_number = current_number + 1, updated_at = CURRENT_TIMESTAMP WHERE name = ?',
      ['supplier_bill']
    );

    // Update supplier balance (reduce by payable amount / add to their credit)
    db.execute(
      `UPDATE suppliers SET 
        current_balance = current_balance + ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [balance_amount || 0, supplier_id]
    );

    // Mark sale items as billed (FR-SUPBILL-035)
    const billId = result.lastInsertRowid;
    db.execute(
      `UPDATE sale_items SET supplier_bill_id = ?
       WHERE supplier_bill_id IS NULL
         AND is_stock = 0
         AND sale_id IN (
           SELECT id FROM sales
           WHERE supplier_id = ?
             AND status = 'posted'
             AND DATE(sale_date) >= DATE(?)
             AND DATE(sale_date) <= DATE(?)
         )`,
      [billId, supplier_id, date_from, date_to]
    );

    return { ...result, billNumber };
  },

  /**
   * Update an existing draft bill
   * @param {number} id - Bill ID
   * @param {Object} data - Updated bill data
   * @returns {Object} Update result
   */
  update: (id, data) => {
    const {
      vehicle_number,
      commission_pct,
      commission_amount,
      drugs_charges,
      fare_charges,
      labor_charges,
      ice_charges,
      other_charges,
      total_charges,
      total_payable,
      concession_amount,
      cash_paid,
      collection_amount,
      balance_amount,
      notes,
    } = data;

    return db.execute(
      `UPDATE supplier_bills SET
        vehicle_number = ?, commission_pct = ?, commission_amount = ?,
        drugs_charges = ?, fare_charges = ?, labor_charges = ?,
        ice_charges = ?, other_charges = ?, total_charges = ?, total_payable = ?,
        concession_amount = ?, cash_paid = ?, collection_amount = ?, balance_amount = ?,
        notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'draft'`,
      [
        vehicle_number || null,
        commission_pct || 5.0,
        commission_amount || 0,
        drugs_charges || 0,
        fare_charges || 0,
        labor_charges || 0,
        ice_charges || 0,
        other_charges || 0,
        total_charges || 0,
        total_payable || 0,
        concession_amount || 0,
        cash_paid || 0,
        collection_amount || 0,
        balance_amount || 0,
        notes || null,
        id,
      ]
    );
  },

  /**
   * Soft delete a bill (only drafts can be deleted)
   * @param {number} id - Bill ID
   * @returns {Object} Update result
   */
  delete: (id) => {
    return db.execute(
      `UPDATE supplier_bills SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'draft'`,
      [id]
    );
  },
};

// Item queries
const items = {
  /**
   * Get all active items with category names
   * @returns {Array} Items with joined category data
   */
  getAll: () => {
    return db.query(
      `SELECT i.*, 
              c.name as category_name, c.name_urdu as category_name_urdu
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.is_active = 1
       ORDER BY i.name ASC`
    );
  },

  /**
   * Get item by ID with category data
   * @param {number} id - Item ID
   * @returns {Object|null} Item object or null
   */
  getById: (id) => {
    const result = db.query(
      `SELECT i.*, 
              c.name as category_name, c.name_urdu as category_name_urdu
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.id = ?`,
      [id]
    );
    return result[0] || null;
  },

  /**
   * Search items by name (partial match)
   * @param {string} name - Search term
   * @returns {Array} Matching items
   */
  search: (name) => {
    const searchTerm = `%${name}%`;
    return db.query(
      `SELECT i.*, 
              c.name as category_name, c.name_urdu as category_name_urdu
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.is_active = 1 AND (i.name LIKE ? OR i.name_english LIKE ?)
       ORDER BY i.name ASC`,
      [searchTerm, searchTerm]
    );
  },

  /**
   * Check if item name already exists (for validation)
   * @param {string} name - Item name to check
   * @param {number|null} excludeId - Item ID to exclude (for updates)
   * @returns {boolean} True if name exists
   */
  checkName: (name, excludeId = null) => {
    if (!name || name.trim() === '') return false;

    const query = excludeId
      ? 'SELECT COUNT(*) as count FROM items WHERE name = ? AND id != ? AND is_active = 1'
      : 'SELECT COUNT(*) as count FROM items WHERE name = ? AND is_active = 1';

    const params = excludeId ? [name, excludeId] : [name];
    const result = db.query(query, params);
    return result[0]?.count > 0;
  },

  /**
   * Create a new item
   * @param {Object} data - Item data
   * @returns {Object} Insert result with lastInsertRowid
   */
  create: (data) => {
    const { name, name_english, category_id, unit_price, notes, created_by } = data;

    return db.execute(
      `INSERT INTO items (
        name, name_english, category_id, unit_price, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        name_english || null,
        category_id || null,
        unit_price || 0,
        notes || null,
        created_by || null,
      ]
    );
  },

  /**
   * Update an existing item
   * @param {number} id - Item ID
   * @param {Object} data - Updated item data
   * @returns {Object} Update result
   */
  update: (id, data) => {
    const { name, name_english, category_id, unit_price, notes } = data;

    return db.execute(
      `UPDATE items SET
        name = ?, name_english = ?, category_id = ?, unit_price = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, name_english || null, category_id || null, unit_price || 0, notes || null, id]
    );
  },

  /**
   * Soft delete an item (set is_active = 0)
   * @param {number} id - Item ID
   * @returns {Object} Update result
   */
  delete: (id) => {
    return db.execute(
      `UPDATE items SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  },

  /**
   * Check if item has any transactions (prevents deletion)
   * @param {number} id - Item ID
   * @returns {boolean} True if item has transactions
   */
  hasTransactions: (id) => {
    const saleResult = db.query('SELECT COUNT(*) as count FROM sale_items WHERE item_id = ?', [id]);
    const purchaseResult = db.query(
      'SELECT COUNT(*) as count FROM purchase_items WHERE item_id = ?',
      [id]
    );
    return (saleResult[0]?.count || 0) > 0 || (purchaseResult[0]?.count || 0) > 0;
  },
};

// Sales queries
const sales = {
  /**
   * Get all sales with customer/supplier info
   * @returns {Array} Sales with joined data
   */
  getAll: () => {
    return db.query(
      `SELECT s.*,
              c.name as customer_name, c.name_english as customer_name_english,
              sup.name as supplier_name, sup.name_english as supplier_name_english
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN suppliers sup ON s.supplier_id = sup.id
       WHERE s.status != 'deleted'
       ORDER BY s.sale_date DESC, s.created_at DESC
       LIMIT 100`
    );
  },

  /**
   * Get sale by ID with line items
   * @param {number} id - Sale ID
   * @returns {Object|null} Sale with items or null
   */
  getById: (id) => {
    const sale = db.query(
      `SELECT s.*,
              c.name as customer_name, c.name_english as customer_name_english,
              c.current_balance as customer_balance,
              sup.name as supplier_name, sup.name_english as supplier_name_english
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN suppliers sup ON s.supplier_id = sup.id
       WHERE s.id = ?`,
      [id]
    );

    if (!sale[0]) return null;

    // Get line items with customer names (per-line customer = گابک)
    const items = db.query(
      `SELECT si.*,
              i.name as item_name, i.name_english as item_name_english,
              i.current_stock as item_stock,
              c2.name as line_customer_name, c2.name_english as line_customer_name_english
       FROM sale_items si
       LEFT JOIN items i ON si.item_id = i.id
       LEFT JOIN customers c2 ON si.customer_id = c2.id
       WHERE si.sale_id = ?
       ORDER BY si.line_number ASC`,
      [id]
    );

    return { ...sale[0], items };
  },

  /**
   * Search sales by filters
   * @param {Object} filters - Search filters
   * @returns {Array} Matching sales
   */
  search: (filters) => {
    const { dateFrom, dateTo, customerId, saleNumber, allCustomers } = filters;

    let query = `
      SELECT s.*,
             c.name as customer_name, c.name_english as customer_name_english,
             sup.name as supplier_name, sup.name_english as supplier_name_english
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      WHERE s.status != 'deleted'
    `;
    const params = [];

    // Date range filter
    if (dateFrom) {
      query += ' AND DATE(s.sale_date) >= DATE(?)';
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ' AND DATE(s.sale_date) <= DATE(?)';
      params.push(dateTo);
    }

    // Customer filter
    if (!allCustomers && customerId) {
      query += ' AND s.customer_id = ?';
      params.push(customerId);
    }

    // Sale number filter
    if (saleNumber) {
      query += ' AND s.sale_number LIKE ?';
      params.push(`%${saleNumber}%`);
    }

    query += ' ORDER BY s.sale_date DESC, s.created_at DESC LIMIT 200';

    return db.query(query, params);
  },

  /**
   * Get next sale number from sequence
   * @returns {string} Next sale number (e.g., "SL-000001")
   */
  getNextSaleNumber: () => {
    const result = db.query(
      'SELECT prefix, current_number, number_length FROM number_sequences WHERE name = ?',
      ['sale']
    );
    if (!result[0]) {
      return 'SL-000001';
    }
    const { prefix, current_number, number_length } = result[0];
    const nextNum = (current_number + 1).toString().padStart(number_length, '0');
    return `${prefix}${nextNum}`;
  },

  /**
   * Create a new sale with line items
   * @param {Object} data - Sale data with items array
   * @returns {Object} Insert result
   */
  create: (data) => {
    const {
      customer_id,
      supplier_id,
      vehicle_number,
      sale_date,
      details,
      items: saleItems,
      created_by,
    } = data;

    // Get next sale number
    const saleNumber = sales.getNextSaleNumber();

    // Calculate totals from items
    let totalWeight = 0;
    let grossAmount = 0;
    let fareCharges = 0;
    let iceCharges = 0;
    let cashReceived = 0;
    let receiptAmount = 0;

    for (const item of saleItems) {
      const lineWeight = item.weight || 0;
      const lineAmount = lineWeight * (item.rate || 0);
      totalWeight += lineWeight;
      grossAmount += lineAmount;
      fareCharges += item.fare_charges || 0;
      iceCharges += item.ice_charges || 0;
      cashReceived += item.cash_amount || 0;
      receiptAmount += item.receipt_amount || 0;
    }

    const netAmount = grossAmount + fareCharges + iceCharges;
    const balanceAmount = netAmount - cashReceived - receiptAmount;

    // Insert sale header
    const saleResult = db.execute(
      `INSERT INTO sales (
        sale_number, sale_date, customer_id, supplier_id, vehicle_number, details,
        total_weight, net_weight, gross_amount,
        fare_charges, ice_charges, discount_amount, net_amount,
        cash_received, receipt_amount, balance_amount, previous_balance,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted', ?)`,
      [
        saleNumber,
        sale_date,
        customer_id || null,
        supplier_id || null,
        vehicle_number || null,
        details || null,
        totalWeight,
        totalWeight, // net_weight = total_weight (no tare)
        grossAmount,
        fareCharges,
        iceCharges,
        0,
        netAmount,
        cashReceived,
        receiptAmount,
        balanceAmount,
        0, // previousBalance calculated per-customer in line items
        created_by || null,
      ]
    );

    const saleId = saleResult.lastInsertRowid;

    // Insert line items, update stock, and track per-customer balances
    const customerBalances = {}; // { customerId: balanceAmount }

    for (let i = 0; i < saleItems.length; i++) {
      const item = saleItems[i];
      const lineWeight = item.weight || 0;
      const lineAmount = lineWeight * (item.rate || 0);
      const lineFare = item.fare_charges || 0;
      const lineIce = item.ice_charges || 0;
      const lineNetAmount = lineAmount + lineFare + lineIce;
      const lineBalance = lineNetAmount - (item.cash_amount || 0) - (item.receipt_amount || 0);

      db.execute(
        `INSERT INTO sale_items (
          sale_id, line_number, item_id, customer_id, is_stock,
          rate_per_maund, rate, weight, amount,
          fare_charges, ice_charges, other_charges,
          cash_amount, receipt_amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          i + 1,
          item.item_id,
          item.customer_id || null,
          item.is_stock ? 1 : 0,
          item.rate_per_maund || 0,
          item.rate || 0,
          lineWeight,
          lineAmount,
          lineFare,
          lineIce,
          item.other_charges || 0,
          item.cash_amount || 0,
          item.receipt_amount || 0,
          item.notes || null,
        ]
      );

      // Update item stock (reduce by weight)
      if (item.is_stock) {
        db.execute(
          `UPDATE items SET 
            current_stock = current_stock - ?,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [lineWeight, item.item_id]
        );
      }

      // Track balance per customer
      if (item.customer_id) {
        customerBalances[item.customer_id] =
          (customerBalances[item.customer_id] || 0) + lineBalance;
      }
    }

    // Update number sequence
    db.execute(
      'UPDATE number_sequences SET current_number = current_number + 1, updated_at = CURRENT_TIMESTAMP WHERE name = ?',
      ['sale']
    );

    // Update each customer's balance
    for (const [custId, balance] of Object.entries(customerBalances)) {
      db.execute(
        `UPDATE customers SET 
          current_balance = current_balance + ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [balance, custId]
      );
    }

    return { lastInsertRowid: saleId, saleNumber };
  },

  /**
   * Update an existing sale
   * @param {number} id - Sale ID
   * @param {Object} data - Updated sale data
   * @returns {Object} Update result
   */
  update: (id, data) => {
    const { customer_id, supplier_id, vehicle_number, sale_date, details, items: saleItems } = data;

    // Get existing sale for balance restoration
    const existingSale = sales.getById(id);
    if (!existingSale) throw new Error('Sale not found');

    // Restore previous stock levels
    for (const item of existingSale.items) {
      if (item.is_stock) {
        db.execute(
          'UPDATE items SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [item.weight || 0, item.item_id]
        );
      }
    }

    // Restore per-line-item customer balances
    const oldCustomerBalances = {};
    for (const item of existingSale.items) {
      if (item.customer_id) {
        const lineAmount = (item.amount || 0) + (item.fare_charges || 0) + (item.ice_charges || 0);
        const lineBalance = lineAmount - (item.cash_amount || 0) - (item.receipt_amount || 0);
        oldCustomerBalances[item.customer_id] =
          (oldCustomerBalances[item.customer_id] || 0) + lineBalance;
      }
    }
    for (const [custId, balance] of Object.entries(oldCustomerBalances)) {
      db.execute(
        'UPDATE customers SET current_balance = current_balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [balance, custId]
      );
    }

    // Delete old line items
    db.execute('DELETE FROM sale_items WHERE sale_id = ?', [id]);

    // Calculate new totals
    let totalWeight = 0;
    let grossAmount = 0;
    let fareCharges = 0;
    let iceCharges = 0;
    let cashReceived = 0;
    let receiptAmount = 0;

    for (const item of saleItems) {
      const lineWeight = item.weight || 0;
      const lineAmount = lineWeight * (item.rate || 0);
      totalWeight += lineWeight;
      grossAmount += lineAmount;
      fareCharges += item.fare_charges || 0;
      iceCharges += item.ice_charges || 0;
      cashReceived += item.cash_amount || 0;
      receiptAmount += item.receipt_amount || 0;
    }

    const netAmount = grossAmount + fareCharges + iceCharges;
    const balanceAmount = netAmount - cashReceived - receiptAmount;

    // Update sale header
    db.execute(
      `UPDATE sales SET
        customer_id = ?, supplier_id = ?, vehicle_number = ?, sale_date = ?, details = ?,
        total_weight = ?, net_weight = ?, gross_amount = ?,
        fare_charges = ?, ice_charges = ?, net_amount = ?,
        cash_received = ?, receipt_amount = ?, balance_amount = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        customer_id || null,
        supplier_id || null,
        vehicle_number || null,
        sale_date,
        details || null,
        totalWeight,
        totalWeight,
        grossAmount,
        fareCharges,
        iceCharges,
        netAmount,
        cashReceived,
        receiptAmount,
        balanceAmount,
        id,
      ]
    );

    // Insert new line items and track per-customer balances
    const newCustomerBalances = {};

    for (let i = 0; i < saleItems.length; i++) {
      const item = saleItems[i];
      const lineWeight = item.weight || 0;
      const lineAmount = lineWeight * (item.rate || 0);
      const lineFare = item.fare_charges || 0;
      const lineIce = item.ice_charges || 0;
      const lineNetAmount = lineAmount + lineFare + lineIce;
      const lineBalance = lineNetAmount - (item.cash_amount || 0) - (item.receipt_amount || 0);

      db.execute(
        `INSERT INTO sale_items (
          sale_id, line_number, item_id, customer_id, is_stock,
          rate_per_maund, rate, weight, amount,
          fare_charges, ice_charges, other_charges,
          cash_amount, receipt_amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          i + 1,
          item.item_id,
          item.customer_id || null,
          item.is_stock ? 1 : 0,
          item.rate_per_maund || 0,
          item.rate || 0,
          lineWeight,
          lineAmount,
          lineFare,
          lineIce,
          item.other_charges || 0,
          item.cash_amount || 0,
          item.receipt_amount || 0,
          item.notes || null,
        ]
      );

      // Update item stock
      if (item.is_stock) {
        db.execute(
          'UPDATE items SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [lineWeight, item.item_id]
        );
      }

      // Track balance per customer
      if (item.customer_id) {
        newCustomerBalances[item.customer_id] =
          (newCustomerBalances[item.customer_id] || 0) + lineBalance;
      }
    }

    // Update each customer's balance
    for (const [custId, balance] of Object.entries(newCustomerBalances)) {
      db.execute(
        'UPDATE customers SET current_balance = current_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [balance, custId]
      );
    }

    return { changes: 1 };
  },

  /**
   * Soft delete a sale and restore stock/balance
   * @param {number} id - Sale ID
   * @returns {Object} Update result
   */
  delete: (id) => {
    const sale = sales.getById(id);
    if (!sale) throw new Error('Sale not found');

    // Restore stock levels
    for (const item of sale.items) {
      if (item.is_stock) {
        db.execute(
          'UPDATE items SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [item.weight || 0, item.item_id]
        );
      }
    }

    // Restore per-line-item customer balances
    const customerBalances = {};
    for (const item of sale.items) {
      if (item.customer_id) {
        const lineAmount = (item.amount || 0) + (item.fare_charges || 0) + (item.ice_charges || 0);
        const lineBalance = lineAmount - (item.cash_amount || 0) - (item.receipt_amount || 0);
        customerBalances[item.customer_id] =
          (customerBalances[item.customer_id] || 0) + lineBalance;
      }
    }
    for (const [custId, balance] of Object.entries(customerBalances)) {
      db.execute(
        'UPDATE customers SET current_balance = current_balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [balance, custId]
      );
    }

    // Soft delete
    return db.execute(
      "UPDATE sales SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
  },
};

// Purchases queries
const purchases = {
  /**
   * Get all purchases with supplier info
   * @returns {Array} Purchases with joined data
   */
  getAll: () => {
    return db.query(
      `SELECT p.*,
              s.name as supplier_name, s.name_english as supplier_name_english
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.status != 'deleted'
       ORDER BY p.purchase_date DESC, p.created_at DESC
       LIMIT 100`
    );
  },

  /**
   * Get purchase by ID with line items
   * @param {number} id - Purchase ID
   * @returns {Object|null} Purchase with items or null
   */
  getById: (id) => {
    const purchase = db.query(
      `SELECT p.*,
              s.name as supplier_name, s.name_english as supplier_name_english,
              s.current_balance as supplier_balance
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`,
      [id]
    );

    if (!purchase[0]) return null;

    // Get line items
    const items = db.query(
      `SELECT pi.*,
              i.name as item_name, i.name_english as item_name_english,
              i.current_stock as item_stock
       FROM purchase_items pi
       LEFT JOIN items i ON pi.item_id = i.id
       WHERE pi.purchase_id = ?
       ORDER BY pi.line_number ASC`,
      [id]
    );

    return { ...purchase[0], items };
  },

  /**
   * Search purchases by filters
   * @param {Object} filters - Search filters
   * @returns {Array} Matching purchases
   */
  search: (filters) => {
    const { dateFrom, dateTo, supplierId, purchaseNumber, filterByDate, filterBySupplier } =
      filters;

    let query = `
      SELECT p.*,
             s.name as supplier_name, s.name_english as supplier_name_english
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.status != 'deleted'
    `;
    const params = [];

    // Date range filter
    if (filterByDate && dateFrom) {
      query += ' AND DATE(p.purchase_date) >= DATE(?)';
      params.push(dateFrom);
    }
    if (filterByDate && dateTo) {
      query += ' AND DATE(p.purchase_date) <= DATE(?)';
      params.push(dateTo);
    }

    // Supplier filter
    if (filterBySupplier && supplierId) {
      query += ' AND p.supplier_id = ?';
      params.push(supplierId);
    }

    // Purchase number filter
    if (purchaseNumber) {
      query += ' AND p.purchase_number LIKE ?';
      params.push(`%${purchaseNumber}%`);
    }

    query += ' ORDER BY p.purchase_date DESC, p.created_at DESC LIMIT 200';

    return db.query(query, params);
  },

  /**
   * Get next purchase number from sequence
   * @returns {string} Next purchase number (e.g., "PO-000001")
   */
  getNextPurchaseNumber: () => {
    const result = db.query(
      'SELECT prefix, current_number, number_length FROM number_sequences WHERE name = ?',
      ['purchase']
    );
    if (!result[0]) {
      return 'PO-000001';
    }
    const { prefix, current_number, number_length } = result[0];
    const nextNum = (current_number + 1).toString().padStart(number_length, '0');
    return `${prefix}${nextNum}`;
  },

  /**
   * Create a new purchase with line items
   * @param {Object} data - Purchase data with items array
   * @returns {Object} Insert result
   */
  create: (data) => {
    const {
      supplier_id,
      vehicle_number,
      purchase_date,
      details,
      concession_amount,
      cash_paid,
      items: purchaseItems,
      created_by,
    } = data;

    // Get next purchase number
    const purchaseNumber = purchases.getNextPurchaseNumber();

    // Get supplier's previous balance
    const supplierResult = db.query('SELECT current_balance FROM suppliers WHERE id = ?', [
      supplier_id,
    ]);
    const previousBalance = supplierResult[0]?.current_balance || 0;

    // Calculate totals from items
    let totalWeight = 0;
    let grossAmount = 0;

    for (const item of purchaseItems) {
      totalWeight += item.weight || 0;
      grossAmount += item.amount || 0;
    }

    const netAmount = grossAmount - (concession_amount || 0);
    const balanceAmount = netAmount - (cash_paid || 0) + previousBalance;

    // Insert purchase header
    const purchaseResult = db.execute(
      `INSERT INTO purchases (
        purchase_number, purchase_date, supplier_id, vehicle_number, details,
        total_weight, gross_amount, concession_amount, net_amount,
        cash_paid, previous_balance, balance_amount,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted', ?)`,
      [
        purchaseNumber,
        purchase_date,
        supplier_id,
        vehicle_number || null,
        details || null,
        totalWeight,
        grossAmount,
        concession_amount || 0,
        netAmount,
        cash_paid || 0,
        previousBalance,
        balanceAmount,
        created_by || null,
      ]
    );

    const purchaseId = purchaseResult.lastInsertRowid;

    // Insert line items and update stock
    for (let i = 0; i < purchaseItems.length; i++) {
      const item = purchaseItems[i];
      const lineAmount = (item.weight || 0) * (item.rate || 0);

      db.execute(
        `INSERT INTO purchase_items (
          purchase_id, line_number, item_id, weight, rate, amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          purchaseId,
          i + 1,
          item.item_id,
          item.weight || 0,
          item.rate || 0,
          lineAmount,
          item.notes || null,
        ]
      );

      // Update item stock (increase by weight)
      db.execute(
        `UPDATE items SET 
          current_stock = current_stock + ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [item.weight || 0, item.item_id]
      );
    }

    // Update number sequence
    db.execute(
      'UPDATE number_sequences SET current_number = current_number + 1, updated_at = CURRENT_TIMESTAMP WHERE name = ?',
      ['purchase']
    );

    // Update supplier balance (increase what we owe them)
    db.execute(
      `UPDATE suppliers SET 
        current_balance = current_balance + ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [netAmount - (cash_paid || 0), supplier_id]
    );

    return { lastInsertRowid: purchaseId, purchaseNumber };
  },

  /**
   * Update an existing purchase
   * @param {number} id - Purchase ID
   * @param {Object} data - Updated purchase data
   * @returns {Object} Update result
   */
  update: (id, data) => {
    const {
      supplier_id,
      vehicle_number,
      purchase_date,
      details,
      concession_amount,
      cash_paid,
      items: purchaseItems,
    } = data;

    // Get existing purchase for balance/stock restoration
    const existingPurchase = purchases.getById(id);
    if (!existingPurchase) throw new Error('Purchase not found');

    // Restore previous stock levels
    for (const item of existingPurchase.items) {
      db.execute(
        'UPDATE items SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.weight || 0, item.item_id]
      );
    }

    // Restore supplier balance
    const oldNetAmount = existingPurchase.net_amount || 0;
    const oldCashPaid = existingPurchase.cash_paid || 0;
    db.execute(
      'UPDATE suppliers SET current_balance = current_balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [oldNetAmount - oldCashPaid, existingPurchase.supplier_id]
    );

    // Delete old line items
    db.execute('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);

    // Calculate new totals
    let totalWeight = 0;
    let grossAmount = 0;

    for (const item of purchaseItems) {
      totalWeight += item.weight || 0;
      grossAmount += item.amount || 0;
    }

    const netAmount = grossAmount - (concession_amount || 0);

    // Get new supplier's previous balance
    const supplierResult = db.query('SELECT current_balance FROM suppliers WHERE id = ?', [
      supplier_id,
    ]);
    const previousBalance = supplierResult[0]?.current_balance || 0;
    const balanceAmount = netAmount - (cash_paid || 0) + previousBalance;

    // Update purchase header
    db.execute(
      `UPDATE purchases SET
        supplier_id = ?, vehicle_number = ?, purchase_date = ?, details = ?,
        total_weight = ?, gross_amount = ?, concession_amount = ?, net_amount = ?,
        cash_paid = ?, previous_balance = ?, balance_amount = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        supplier_id,
        vehicle_number || null,
        purchase_date,
        details || null,
        totalWeight,
        grossAmount,
        concession_amount || 0,
        netAmount,
        cash_paid || 0,
        previousBalance,
        balanceAmount,
        id,
      ]
    );

    // Insert new line items
    for (let i = 0; i < purchaseItems.length; i++) {
      const item = purchaseItems[i];
      const lineAmount = (item.weight || 0) * (item.rate || 0);

      db.execute(
        `INSERT INTO purchase_items (
          purchase_id, line_number, item_id, weight, rate, amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, i + 1, item.item_id, item.weight || 0, item.rate || 0, lineAmount, item.notes || null]
      );

      // Update item stock
      db.execute(
        'UPDATE items SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.weight || 0, item.item_id]
      );
    }

    // Update supplier balance
    db.execute(
      'UPDATE suppliers SET current_balance = current_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [netAmount - (cash_paid || 0), supplier_id]
    );

    return { changes: 1 };
  },

  /**
   * Soft delete a purchase and restore stock/balance
   * @param {number} id - Purchase ID
   * @returns {Object} Update result
   */
  delete: (id) => {
    const purchase = purchases.getById(id);
    if (!purchase) throw new Error('Purchase not found');

    // Restore stock levels
    for (const item of purchase.items) {
      db.execute(
        'UPDATE items SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.weight || 0, item.item_id]
      );
    }

    // Restore supplier balance
    const netAmount = purchase.net_amount || 0;
    const cashPaid = purchase.cash_paid || 0;
    db.execute(
      'UPDATE suppliers SET current_balance = current_balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [netAmount - cashPaid, purchase.supplier_id]
    );

    // Soft delete
    return db.execute(
      "UPDATE purchases SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
  },
};

// Reports queries
const reports = {
  /**
   * Client Recovery Report (8.1) - FR-CLIENTRPT-*
   * Get sales summary for a client within date range
   * @param {number|null} customerId - Customer ID (null for all)
   * @param {string} dateFrom - Start date (YYYY-MM-DD)
   * @param {string} dateTo - End date (YYYY-MM-DD)
   * @param {boolean} allClients - Whether to include all clients
   * @returns {Object} Report data with transactions and totals
   */
  getClientRecovery: (customerId, dateFrom, dateTo, allClients = false) => {
    let query = `
      SELECT 
        s.id as sale_id,
        s.sale_number,
        s.sale_date,
        c.id as customer_id,
        c.name as customer_name,
        c.name_english as customer_name_english,
        si.item_id,
        i.name as item_name,
        si.weight,
        si.rate,
        si.amount,
        s.fare_charges,
        s.ice_charges,
        s.cash_received,
        s.receipt_amount,
        s.discount_amount,
        s.net_amount,
        s.balance_amount
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN items i ON si.item_id = i.id
      WHERE s.status != 'deleted'
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)
    `;
    const params = [dateFrom, dateTo];

    if (!allClients && customerId) {
      query += ' AND s.customer_id = ?';
      params.push(customerId);
    }

    query += ' ORDER BY c.name, s.sale_date, s.sale_number';

    const transactions = db.query(query, params);

    // Calculate summary by customer
    const summaryQuery = `
      SELECT 
        c.id as customer_id,
        c.name as customer_name,
        c.name_english as customer_name_english,
        SUM(s.net_amount) as total_amount,
        SUM(s.fare_charges + s.ice_charges) as total_charges,
        SUM(s.cash_received + s.receipt_amount) as total_collection,
        SUM(s.discount_amount) as total_discount,
        SUM(s.balance_amount) as total_balance
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status != 'deleted'
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)
        ${!allClients && customerId ? 'AND s.customer_id = ?' : ''}
      GROUP BY c.id
      ORDER BY c.name
    `;
    const summaryParams = [dateFrom, dateTo];
    if (!allClients && customerId) summaryParams.push(customerId);

    const summary = db.query(summaryQuery, summaryParams);

    return { transactions, summary };
  },

  /**
   * Item Sale Report (8.2) - FR-ITEMRPT-*
   * Get sales for a specific item within date range
   * @param {number} itemId - Item ID
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
   * @returns {Object} Report data with line items and totals
   */
  getItemSales: (itemId, dateFrom, dateTo) => {
    const transactions = db.query(
      `SELECT 
        s.sale_number,
        s.sale_date,
        c.name as customer_name,
        c.name_english as customer_name_english,
        i.name as item_name,
        i.name_english as item_name_english,
        si.weight,
        si.rate,
        si.amount
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      JOIN items i ON si.item_id = i.id
      WHERE s.status != 'deleted'
        AND si.item_id = ?
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)
      ORDER BY s.sale_date, s.sale_number`,
      [itemId, dateFrom, dateTo]
    );

    const summary = db.query(
      `SELECT 
        SUM(si.weight) as total_weight,
        SUM(si.amount) as total_amount,
        AVG(si.rate) as avg_rate
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status != 'deleted'
        AND si.item_id = ?
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)`,
      [itemId, dateFrom, dateTo]
    );

    return { transactions, summary: summary[0] || {} };
  },

  /**
   * Daily Sales Report (8.3) - FR-DAILYRPT-*
   * Get aggregated daily sales summary
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
   * @returns {Object} Report data with item totals and grand totals
   */
  getDailySales: (dateFrom, dateTo) => {
    // Aggregate by item type
    const byItem = db.query(
      `SELECT 
        i.id as item_id,
        i.name as item_name,
        i.name_english as item_name_english,
        SUM(si.weight) as total_weight,
        SUM(si.amount) as total_amount
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN items i ON si.item_id = i.id
      WHERE s.status != 'deleted'
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)
      GROUP BY i.id
      ORDER BY i.name`,
      [dateFrom, dateTo]
    );

    // Grand totals
    const totals = db.query(
      `SELECT 
        SUM(s.net_weight) as total_weight,
        SUM(s.gross_amount) as gross_amount,
        SUM(s.fare_charges + s.ice_charges) as total_charges,
        SUM(s.net_amount) as net_amount,
        SUM(s.cash_received) as cash_received,
        SUM(s.receipt_amount) as total_collection,
        SUM(s.discount_amount) as total_discount,
        SUM(s.balance_amount) as total_balance
      FROM sales s
      WHERE s.status != 'deleted'
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)`,
      [dateFrom, dateTo]
    );

    return { byItem, totals: totals[0] || {} };
  },

  /**
   * Ledger Report (8.4) - FR-LEDGER-*
   * Get account ledger for customer or supplier
   * @param {number} accountId - Customer/Supplier ID
   * @param {string} accountType - 'customer' or 'supplier'
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
   * @returns {Object} Ledger with opening balance and transactions
   */
  getLedger: (accountId, accountType, dateFrom, dateTo) => {
    let openingBalance = 0;
    let transactions = [];

    if (accountType === 'customer') {
      // Get customer opening balance (before dateFrom)
      const obResult = db.query(
        `SELECT c.opening_balance +
          COALESCE((SELECT SUM(s.balance_amount) FROM sales s 
            WHERE s.customer_id = c.id AND s.status != 'deleted' 
            AND DATE(s.sale_date) < DATE(?)), 0) -
          COALESCE((SELECT SUM(p.amount) FROM payments p 
            WHERE p.customer_id = c.id AND p.status = 'posted' 
            AND DATE(p.payment_date) < DATE(?)), 0) as opening_balance
        FROM customers c WHERE c.id = ?`,
        [dateFrom, dateFrom, accountId]
      );
      openingBalance = obResult[0]?.opening_balance || 0;

      // Get transactions (sales as debit, payments as credit)
      transactions = db.query(
        `SELECT 
          'sale' as type,
          s.sale_number as reference,
          s.sale_date as date,
          'Sale' as description,
          s.net_amount as debit,
          0 as credit
        FROM sales s
        WHERE s.customer_id = ? AND s.status != 'deleted'
          AND DATE(s.sale_date) >= DATE(?)
          AND DATE(s.sale_date) <= DATE(?)
        UNION ALL
        SELECT 
          'payment' as type,
          p.payment_number as reference,
          p.payment_date as date,
          COALESCE(p.description, 'Payment Received') as description,
          0 as debit,
          p.amount as credit
        FROM payments p
        WHERE p.customer_id = ? AND p.status = 'posted'
          AND DATE(p.payment_date) >= DATE(?)
          AND DATE(p.payment_date) <= DATE(?)
        ORDER BY date, type`,
        [accountId, dateFrom, dateTo, accountId, dateFrom, dateTo]
      );
    } else {
      // Supplier ledger
      const obResult = db.query(
        `SELECT s.opening_balance +
          COALESCE((SELECT SUM(pu.net_amount - pu.cash_paid) FROM purchases pu 
            WHERE pu.supplier_id = s.id AND pu.status != 'deleted' 
            AND DATE(pu.purchase_date) < DATE(?)), 0) -
          COALESCE((SELECT SUM(p.amount) FROM payments p 
            WHERE p.supplier_id = s.id AND p.status = 'posted' 
            AND DATE(p.payment_date) < DATE(?)), 0) as opening_balance
        FROM suppliers s WHERE s.id = ?`,
        [dateFrom, dateFrom, accountId]
      );
      openingBalance = obResult[0]?.opening_balance || 0;

      transactions = db.query(
        `SELECT 
          'purchase' as type,
          pu.purchase_number as reference,
          pu.purchase_date as date,
          'Purchase' as description,
          pu.net_amount as debit,
          pu.cash_paid as credit
        FROM purchases pu
        WHERE pu.supplier_id = ? AND pu.status != 'deleted'
          AND DATE(pu.purchase_date) >= DATE(?)
          AND DATE(pu.purchase_date) <= DATE(?)
        UNION ALL
        SELECT 
          'payment' as type,
          p.payment_number as reference,
          p.payment_date as date,
          COALESCE(p.description, 'Payment Made') as description,
          0 as debit,
          p.amount as credit
        FROM payments p
        WHERE p.supplier_id = ? AND p.status = 'posted'
          AND DATE(p.payment_date) >= DATE(?)
          AND DATE(p.payment_date) <= DATE(?)
        ORDER BY date, type`,
        [accountId, dateFrom, dateTo, accountId, dateFrom, dateTo]
      );
    }

    return { openingBalance, transactions };
  },

  /**
   * Item Purchase Report (8.5) - FR-ITEMPURCHRPT-*
   * Get purchases for a specific item within date range
   * @param {number} itemId - Item ID
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
   * @returns {Object} Report data with line items and totals
   */
  getItemPurchases: (itemId, dateFrom, dateTo) => {
    const transactions = db.query(
      `SELECT 
        p.purchase_number,
        p.purchase_date,
        s.name as supplier_name,
        s.name_english as supplier_name_english,
        i.name as item_name,
        i.name_english as item_name_english,
        pi.weight,
        pi.rate,
        pi.amount
      FROM purchase_items pi
      JOIN purchases p ON pi.purchase_id = p.id
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN items i ON pi.item_id = i.id
      WHERE p.status != 'deleted'
        AND pi.item_id = ?
        AND DATE(p.purchase_date) >= DATE(?)
        AND DATE(p.purchase_date) <= DATE(?)
      ORDER BY p.purchase_date, p.purchase_number`,
      [itemId, dateFrom, dateTo]
    );

    const summary = db.query(
      `SELECT 
        SUM(pi.weight) as total_weight,
        SUM(pi.amount) as total_amount,
        AVG(pi.rate) as avg_rate
      FROM purchase_items pi
      JOIN purchases p ON pi.purchase_id = p.id
      WHERE p.status != 'deleted'
        AND pi.item_id = ?
        AND DATE(p.purchase_date) >= DATE(?)
        AND DATE(p.purchase_date) <= DATE(?)`,
      [itemId, dateFrom, dateTo]
    );

    return { transactions, summary: summary[0] || {} };
  },

  /**
   * Stock Report (8.6) - FR-STOCKRPT-*
   * Get stock levels for all items as of a specific date
   * @param {string} asOfDate - Date to calculate stock for (YYYY-MM-DD)
   * @returns {Object} Stock levels per item
   */
  getStockReport: (asOfDate) => {
    const items = db.query(
      `SELECT 
        i.id,
        i.name as item_name,
        i.name_english as item_name_english,
        i.opening_stock,
        COALESCE((
          SELECT SUM(pi.weight)
          FROM purchase_items pi
          JOIN purchases p ON pi.purchase_id = p.id
          WHERE pi.item_id = i.id 
            AND p.status != 'deleted'
            AND DATE(p.purchase_date) < DATE(?)
        ), 0) as purchases_before,
        COALESCE((
          SELECT SUM(si.weight)
          FROM sale_items si
          JOIN sales s ON si.sale_id = s.id
          WHERE si.item_id = i.id 
            AND si.is_stock = 1
            AND s.status != 'deleted'
            AND DATE(s.sale_date) < DATE(?)
        ), 0) as sales_before,
        COALESCE((
          SELECT SUM(pi.weight)
          FROM purchase_items pi
          JOIN purchases p ON pi.purchase_id = p.id
          WHERE pi.item_id = i.id 
            AND p.status != 'deleted'
            AND DATE(p.purchase_date) = DATE(?)
        ), 0) as today_purchases,
        COALESCE((
          SELECT SUM(si.weight)
          FROM sale_items si
          JOIN sales s ON si.sale_id = s.id
          WHERE si.item_id = i.id 
            AND si.is_stock = 1
            AND s.status != 'deleted'
            AND DATE(s.sale_date) = DATE(?)
        ), 0) as today_sales
      FROM items i
      WHERE i.is_active = 1
      ORDER BY i.name`,
      [asOfDate, asOfDate, asOfDate, asOfDate]
    );

    // Calculate previous stock and remaining stock for each item
    const result = items.map((item) => {
      const previousStock = item.opening_stock + item.purchases_before - item.sales_before;
      const remainingStock = previousStock + item.today_purchases - item.today_sales;
      return {
        ...item,
        previous_stock: previousStock,
        remaining_stock: remainingStock,
      };
    });

    // Calculate totals
    const totals = result.reduce(
      (acc, item) => ({
        previous_stock: acc.previous_stock + item.previous_stock,
        today_purchases: acc.today_purchases + item.today_purchases,
        today_sales: acc.today_sales + item.today_sales,
        remaining_stock: acc.remaining_stock + item.remaining_stock,
      }),
      { previous_stock: 0, today_purchases: 0, today_sales: 0, remaining_stock: 0 }
    );

    return { items: result, totals };
  },

  /**
   * Customer Register (8.7) - FR-CUSTREG-*
   * Get account balances for all customers as of a specific date
   * @param {string} asOfDate - Date to calculate balances for
   * @returns {Object} Customer balances
   */
  getCustomerRegister: (asOfDate) => {
    const customers = db.query(
      `SELECT 
        c.id,
        c.code,
        c.name as customer_name,
        c.name_english as customer_name_english,
        c.opening_balance,
        COALESCE((
          SELECT SUM(s.net_amount)
          FROM sales s
          WHERE s.customer_id = c.id 
            AND s.status != 'deleted'
            AND DATE(s.sale_date) <= DATE(?)
        ), 0) as total_sales,
        COALESCE((
          SELECT SUM(p.amount)
          FROM payments p
          WHERE p.customer_id = c.id 
            AND p.status = 'posted'
            AND DATE(p.payment_date) <= DATE(?)
        ), 0) as total_payments
      FROM customers c
      WHERE c.is_active = 1
      ORDER BY c.name`,
      [asOfDate, asOfDate]
    );

    // Calculate balances
    const result = customers.map((cust) => {
      const balance = cust.opening_balance + cust.total_sales - cust.total_payments;
      return {
        ...cust,
        net_amount: cust.total_sales,
        collection: cust.total_payments,
        balance,
      };
    });

    // Calculate totals
    const totals = result.reduce(
      (acc, cust) => ({
        previous: acc.previous + cust.opening_balance,
        net_amount: acc.net_amount + cust.net_amount,
        collection: acc.collection + cust.collection,
        balance: acc.balance + cust.balance,
      }),
      { previous: 0, net_amount: 0, collection: 0, balance: 0 }
    );

    return { customers: result, totals };
  },

  /**
   * Concession Report (8.8) - FR-CONCESSIONRPT-*
   * Get sales with discounts/concessions
   * @param {number|null} customerId - Customer ID (null for all)
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
   * @param {boolean} allClients - Whether to include all clients
   * @returns {Object} Transactions with concessions
   */
  getConcessionReport: (customerId, dateFrom, dateTo, allClients = false) => {
    let query = `
      SELECT 
        s.id,
        s.sale_number,
        s.sale_date,
        c.name as customer_name,
        c.name_english as customer_name_english,
        s.discount_amount as concession
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status != 'deleted'
        AND s.discount_amount > 0
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)
    `;
    const params = [dateFrom, dateTo];

    if (!allClients && customerId) {
      query += ' AND s.customer_id = ?';
      params.push(customerId);
    }

    query += ' ORDER BY c.name, s.sale_date';

    const transactions = db.query(query, params);

    // Calculate total concessions
    const totalQuery = `
      SELECT SUM(s.discount_amount) as total_concession
      FROM sales s
      WHERE s.status != 'deleted'
        AND s.discount_amount > 0
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)
        ${!allClients && customerId ? 'AND s.customer_id = ?' : ''}
    `;

    const total = db.query(totalQuery, params);

    return { transactions, totalConcession: total[0]?.total_concession || 0 };
  },

  /**
   * Daily Sales Details (8.9) - FR-DAILYDETAIL-*
   * Get detailed line-item sales for a specific date
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Object} Detailed sales with line items
   */
  getDailySalesDetails: (date) => {
    const transactions = db.query(
      `SELECT 
        s.sale_number,
        s.sale_date,
        c.name as customer_name,
        c.name_english as customer_name_english,
        sup.name as supplier_name,
        sup.name_english as supplier_name_english,
        i.name as item_name,
        i.name_english as item_name_english,
        si.weight,
        si.rate,
        si.amount
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      JOIN items i ON si.item_id = i.id
      WHERE s.status != 'deleted'
        AND DATE(s.sale_date) = DATE(?)
      ORDER BY s.sale_number, si.line_number`,
      [date]
    );

    // Totals
    const totals = db.query(
      `SELECT 
        SUM(si.weight) as total_weight,
        SUM(si.amount) as total_amount
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status != 'deleted'
        AND DATE(s.sale_date) = DATE(?)`,
      [date]
    );

    return { transactions, totals: totals[0] || {} };
  },

  /**
   * Vendor Sales Report (8.10) - FR-VENDORSALES-*
   * Get sales grouped by supplier/vendor within date range
   * @param {number|null} supplierId - Supplier ID (null for all)
   * @param {string} dateFrom - Start date (YYYY-MM-DD)
   * @param {string} dateTo - End date (YYYY-MM-DD)
   * @param {boolean} allVendors - Whether to include all vendors
   * @returns {Object} Report data with transactions and summary by supplier
   */
  getVendorSales: (supplierId, dateFrom, dateTo, allVendors = false) => {
    let query = `
      SELECT 
        sup.id as supplier_id,
        sup.name as supplier_name,
        sup.name_english as supplier_name_english,
        s.id as sale_id,
        s.sale_number,
        s.sale_date,
        s.vehicle_number,
        c.name as customer_name,
        c.name_english as customer_name_english,
        i.name as item_name,
        i.name_english as item_name_english,
        si.weight,
        si.rate,
        si.amount,
        (
          SELECT AVG(pi2.rate)
          FROM purchase_items pi2
          JOIN purchases p2 ON pi2.purchase_id = p2.id
          WHERE pi2.item_id = si.item_id
            AND p2.supplier_id = s.supplier_id
            AND p2.status != 'deleted'
            AND DATE(p2.purchase_date) >= DATE(?)
            AND DATE(p2.purchase_date) <= DATE(?)
        ) as purchase_rate
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      JOIN customers c ON s.customer_id = c.id
      JOIN items i ON si.item_id = i.id
      WHERE s.status != 'deleted'
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)
    `;
    const params = [dateFrom, dateTo, dateFrom, dateTo];

    if (!allVendors && supplierId) {
      query += ' AND s.supplier_id = ?';
      params.push(supplierId);
    }

    query += ' ORDER BY sup.name, s.sale_date, s.sale_number';

    const transactions = db.query(query, params);

    // Summary by supplier with vehicle counts
    const summaryQuery = `
      SELECT 
        COALESCE(sup.id, 0) as supplier_id,
        COALESCE(sup.name, 'Unknown') as supplier_name,
        COALESCE(sup.name_english, '') as supplier_name_english,
        COUNT(DISTINCT s.vehicle_number) as vehicle_count,
        SUM(si.weight) as total_weight,
        SUM(si.amount) as total_amount
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      WHERE s.status != 'deleted'
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)
        ${!allVendors && supplierId ? 'AND s.supplier_id = ?' : ''}
      GROUP BY sup.id
      ORDER BY sup.name
    `;
    const summaryParams = [dateFrom, dateTo];
    if (!allVendors && supplierId) summaryParams.push(supplierId);

    const summary = db.query(summaryQuery, summaryParams);

    // Grand totals
    const grandTotals = summary.reduce(
      (acc, row) => ({
        total_vehicles: acc.total_vehicles + (row.vehicle_count || 0),
        total_weight: acc.total_weight + (row.total_weight || 0),
        total_amount: acc.total_amount + (row.total_amount || 0),
      }),
      { total_vehicles: 0, total_weight: 0, total_amount: 0 }
    );

    return { transactions, summary, grandTotals };
  },

  /**
   * Vendor Stock Bill (بیوپاری سٹاک بل)
   * Get stock-sourced items for a supplier on a given date
   * @param {number} supplierId - Supplier ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Object} Report data with items and totals
   */
  getVendorStockBill: (supplierId, date) => {
    const items = db.query(
      `SELECT 
        si.id,
        c.name as customer_name,
        c.name_english as customer_name_english,
        i.name as item_name,
        i.name_english as item_name_english,
        si.rate,
        si.weight,
        si.amount
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      JOIN items i ON si.item_id = i.id
      WHERE si.is_stock = 1
        AND s.supplier_id = ?
        AND DATE(s.sale_date) = DATE(?)
        AND s.status != 'deleted'
      ORDER BY si.line_number ASC`,
      [supplierId, date]
    );

    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

    return { items, totalWeight, totalAmount };
  },

  /**
   * Stock Sale History Report
   * Get all stock-sourced sales within a date range
   * @param {string} dateFrom - Start date (YYYY-MM-DD)
   * @param {string} dateTo - End date (YYYY-MM-DD)
   * @returns {Object} Report data with transactions and totals
   */
  getStockSaleHistory: (dateFrom, dateTo) => {
    const transactions = db.query(
      `SELECT 
        si.id,
        s.sale_number,
        s.sale_date,
        c.name as customer_name,
        c.name_english as customer_name_english,
        i.name as item_name,
        i.name_english as item_name_english,
        sup.name as supplier_name,
        sup.name_english as supplier_name_english,
        si.rate,
        si.weight,
        si.amount
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      JOIN items i ON si.item_id = i.id
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      WHERE si.is_stock = 1
        AND s.status != 'deleted'
        AND DATE(s.sale_date) >= DATE(?)
        AND DATE(s.sale_date) <= DATE(?)
      ORDER BY s.sale_date DESC, s.sale_number, si.line_number`,
      [dateFrom, dateTo]
    );

    const totalWeight = transactions.reduce((sum, item) => sum + (item.weight || 0), 0);
    const totalAmount = transactions.reduce((sum, item) => sum + (item.amount || 0), 0);

    return { transactions, totalWeight, totalAmount };
  },

  /**
   * Daily Net Amount Summary (8.11) - FR-NETSUMMARY-*
   * Get daily net amount summary for day-end reconciliation
   * @param {string} asOfDate - Date to calculate summary for (YYYY-MM-DD)
   * @returns {Object} Summary with previous, today, total, collection, balance
   */
  getDailyNetAmountSummary: (asOfDate) => {
    // Previous balance (all customers' balances before today)
    const prevResult = db.query(
      `SELECT 
        COALESCE(SUM(c.opening_balance), 0) +
        COALESCE((SELECT SUM(s.net_amount) FROM sales s 
          WHERE s.status != 'deleted' AND DATE(s.sale_date) < DATE(?)), 0) -
        COALESCE((SELECT SUM(p.amount) FROM payments p 
          WHERE p.status = 'posted' AND p.customer_id IS NOT NULL 
          AND DATE(p.payment_date) < DATE(?)), 0) as previous_balance
      FROM customers c WHERE c.is_active = 1`,
      [asOfDate, asOfDate]
    );
    const previousBalance = prevResult[0]?.previous_balance || 0;

    // Today's sales
    const todaySalesResult = db.query(
      `SELECT 
        COALESCE(SUM(net_amount), 0) as today_sales,
        COALESCE(SUM(fare_charges + ice_charges), 0) as today_charges,
        COALESCE(SUM(discount_amount), 0) as today_discount
      FROM sales 
      WHERE status != 'deleted' AND DATE(sale_date) = DATE(?)`,
      [asOfDate]
    );
    const todaySales = todaySalesResult[0]?.today_sales || 0;
    const todayCharges = todaySalesResult[0]?.today_charges || 0;
    const todayDiscount = todaySalesResult[0]?.today_discount || 0;

    // Today's collection (cash received + receipts)
    const collectionResult = db.query(
      `SELECT 
        COALESCE(SUM(cash_received + receipt_amount), 0) as today_collection
      FROM sales 
      WHERE status != 'deleted' AND DATE(sale_date) = DATE(?)`,
      [asOfDate]
    );
    const todayCollection = collectionResult[0]?.today_collection || 0;

    // Today's payments received
    const paymentsResult = db.query(
      `SELECT COALESCE(SUM(amount), 0) as today_payments
      FROM payments 
      WHERE status = 'posted' AND customer_id IS NOT NULL 
        AND DATE(payment_date) = DATE(?)`,
      [asOfDate]
    );
    const todayPayments = paymentsResult[0]?.today_payments || 0;

    // Calculate total and closing balance
    const totalCollection = todayCollection + todayPayments;
    const totalAmount = previousBalance + todaySales;
    const closingBalance = totalAmount - totalCollection;

    return {
      previousBalance,
      todaySales,
      todayCharges,
      todayDiscount,
      todayCollection,
      todayPayments,
      totalCollection,
      totalAmount,
      closingBalance,
      asOfDate,
    };
  },
};

// Backup queries (FR-ADMIN-004)
const backup = {
  /**
   * Create database backup
   * @returns {Object} Backup info
   */
  create: () => {
    const fs = require('fs');
    const path = require('path');
    const { app } = require('electron');

    const dbPath = path.join(app.getPath('userData'), 'fishplus.db');
    const backupDir = path.join(app.getPath('userData'), 'backups');

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `fishplus_backup_${timestamp}.db`);

    // Copy database file
    fs.copyFileSync(dbPath, backupPath);

    return {
      path: backupPath,
      timestamp: new Date().toISOString(),
      size: fs.statSync(backupPath).size,
    };
  },

  /**
   * Restore database from backup
   * @param {string} filePath - Path to backup file
   */
  restore: (filePath) => {
    const fs = require('fs');
    const path = require('path');
    const { app } = require('electron');

    if (!fs.existsSync(filePath)) {
      throw new Error('Backup file not found');
    }

    const dbPath = path.join(app.getPath('userData'), 'fishplus.db');

    // Close current database connection before restore
    // Note: This would need to signal the main process to close DB

    // Copy backup to database location
    fs.copyFileSync(filePath, dbPath);
  },

  /**
   * List available backups
   * @returns {Array} List of backup files
   */
  list: () => {
    const fs = require('fs');
    const path = require('path');
    const { app } = require('electron');

    const backupDir = path.join(app.getPath('userData'), 'backups');

    if (!fs.existsSync(backupDir)) {
      return [];
    }

    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith('.db'))
      .map((f) => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
        };
      })
      .sort((a, b) => b.created - a.created);

    return files;
  },
};

// Year-End Processing (FR-ADMIN-007)
const yearEnd = {
  /**
   * Get preview of year-end closing balances
   * @param {string} asOfDate - Closing date (typically 12/31/YYYY)
   * @returns {Object} Preview data with customer and supplier balances
   */
  getPreview: (asOfDate) => {
    // Calculate customer closing balances
    const customerBalances = db.query(
      `SELECT 
        c.id,
        c.name,
        c.name_english,
        c.opening_balance,
        COALESCE(
          c.opening_balance +
          COALESCE((SELECT SUM(s.net_amount) FROM sales s 
            WHERE s.customer_id = c.id AND s.status != 'deleted' 
            AND DATE(s.sale_date) <= DATE(?)), 0) -
          COALESCE((SELECT SUM(p.amount) FROM payments p 
            WHERE p.customer_id = c.id AND p.status = 'posted' 
            AND DATE(p.payment_date) <= DATE(?)), 0),
          c.opening_balance
        ) as closing_balance
      FROM customers c
      WHERE c.is_active = 1
      ORDER BY c.name`,
      [asOfDate, asOfDate]
    );

    // Calculate supplier closing balances
    const supplierBalances = db.query(
      `SELECT 
        s.id,
        s.name,
        s.name_english,
        s.opening_balance as advance_balance,
        COALESCE(
          s.opening_balance +
          COALESCE((SELECT SUM(p.concession_amount + p.net_amount) FROM purchases p 
            WHERE p.supplier_id = s.id AND p.status != 'deleted' 
            AND DATE(p.purchase_date) <= DATE(?)), 0) -
          COALESCE((SELECT SUM(sb.net_amount) FROM supplier_bills sb 
            WHERE sb.supplier_id = s.id AND sb.status != 'deleted' 
            AND DATE(sb.bill_date) <= DATE(?)), 0),
          s.opening_balance
        ) as closing_balance
      FROM suppliers s
      WHERE s.is_active = 1
      ORDER BY s.name`,
      [asOfDate, asOfDate]
    );

    // Summary totals
    const customerTotal = customerBalances.reduce((sum, c) => sum + (c.closing_balance || 0), 0);
    const supplierTotal = supplierBalances.reduce((sum, s) => sum + (s.closing_balance || 0), 0);

    return {
      asOfDate,
      customerBalances,
      supplierBalances,
      summary: {
        customerCount: customerBalances.length,
        supplierCount: supplierBalances.length,
        totalCustomerBalance: customerTotal,
        totalSupplierBalance: supplierTotal,
      },
    };
  },

  /**
   * Process year-end closing - updates opening balances for new year
   * Historical data is preserved, only opening_balance fields are updated
   * @param {string} closingDate - Year-end date (YYYY-MM-DD)
   * @returns {Object} Processing result
   */
  process: (closingDate) => {
    const preview = yearEnd.getPreview(closingDate);

    // Use a transaction to ensure consistency
    const updateCustomers = db.prepare(`UPDATE customers SET opening_balance = ? WHERE id = ?`);
    const updateSuppliers = db.prepare(`UPDATE suppliers SET opening_balance = ? WHERE id = ?`);

    let customersUpdated = 0;
    let suppliersUpdated = 0;

    db.transaction(() => {
      // Update customer opening balances
      for (const customer of preview.customerBalances) {
        updateCustomers.run(customer.closing_balance || 0, customer.id);
        customersUpdated++;
      }

      // Update supplier opening balances (advance balances)
      for (const supplier of preview.supplierBalances) {
        updateSuppliers.run(supplier.closing_balance || 0, supplier.id);
        suppliersUpdated++;
      }

      // Record the year-end processing in settings
      db.execute(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
        ['last_year_end_date', closingDate, closingDate]
      );
    })();

    return {
      success: true,
      closingDate,
      customersUpdated,
      suppliersUpdated,
      summary: preview.summary,
    };
  },

  /**
   * Get year-end processing history
   * @returns {Object} Last processing date and info
   */
  getHistory: () => {
    const result = db.query(
      `SELECT value as last_date, updated_at FROM settings WHERE key = 'last_year_end_date'`
    );
    return result[0] || null;
  },
};

module.exports = {
  settings,
  dashboard,
  suppliers,
  customers,
  reference,
  supplierBills,
  items,
  sales,
  purchases,
  reports,
  backup,
  yearEnd,
};
