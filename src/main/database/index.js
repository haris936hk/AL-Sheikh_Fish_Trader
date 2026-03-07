const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db = null;

/**
 * Initialize the database
 * Database is stored in the user's app data directory
 */
function initialize(customPath = null) {
  if (db) {
    return db;
  }

  try {
    let dbPath;
    if (customPath) {
      dbPath = customPath;
    } else {
      // Get user data path
      const userDataPath = app.getPath('userData');
      dbPath = path.join(userDataPath, 'database.sqlite');
    }

    console.log('Initializing database at:', dbPath);

    // Create database connection
    db = new Database(dbPath, { verbose: console.log });

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Run initial schema if database is new
    // Try multiple paths for schema.sql (handles both dev and production)
    const possiblePaths = [
      path.join(__dirname, 'schema.sql'),
      path.join(app.getAppPath(), 'src', 'main', 'database', 'schema.sql'),
    ];

    let schemaLoaded = false;
    for (const schemaPath of possiblePaths) {
      if (fs.existsSync(schemaPath)) {
        console.log('Loading schema from:', schemaPath);
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
        console.log('Database schema initialized');
        schemaLoaded = true;
        break;
      }
    }

    if (!schemaLoaded) {
      console.warn('Schema file not found, trying inline schema...');
      // Create essential tables inline if schema file not found
      createEssentialTables();
    }

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Create essential tables if schema.sql is not available
 */
function createEssentialTables() {
  db.exec(`
    -- Settings Table
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      description TEXT,
      is_editable INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER
    );

    -- Default settings
    INSERT OR IGNORE INTO settings (key, value, description) VALUES 
      ('company_name', 'AL - SHEIKH FISH TRADER AND DISTRIBUTER', 'Company display name'),
      ('app_theme', 'light', 'Application theme'),
      ('app_language', 'ur', 'Application language');

    -- Suppliers Table
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT NOT NULL,
      name_english TEXT,
      nic TEXT,
      phone TEXT,
      mobile TEXT,
      email TEXT,
      address TEXT,
      city_id INTEGER,
      country_id INTEGER,
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      advance_amount REAL DEFAULT 0,
      default_commission_pct REAL DEFAULT 5.0,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER
    );

    -- Customers Table
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT NOT NULL,
      name_english TEXT,
      nic TEXT,
      phone TEXT,
      mobile TEXT,
      email TEXT,
      address TEXT,
      city_id INTEGER,
      country_id INTEGER,
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      credit_limit REAL,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER
    );

    -- Items Table
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT NOT NULL,
      name_english TEXT,
      category_id INTEGER,
      unit_price REAL DEFAULT 0,
      min_stock_level REAL DEFAULT 0,
      opening_stock REAL DEFAULT 0,
      current_stock REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER
    );

    -- Categories Table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_urdu TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sales Table
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number TEXT NOT NULL UNIQUE,
      sale_date DATE NOT NULL,
      customer_id INTEGER NOT NULL,
      supplier_id INTEGER,
      vehicle_number TEXT,
      details TEXT,
      total_weight REAL DEFAULT 0,
      net_weight REAL DEFAULT 0,
      gross_amount REAL DEFAULT 0,
      net_amount REAL DEFAULT 0,
      cash_received REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
    CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
  `);
  console.log('Essential tables created inline');
}

/**
 * Execute a SELECT query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Array} Query results
 */
function query(sql, params = []) {
  if (!db) initialize();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object} Result with changes and lastInsertRowid
 */
function execute(sql, params = []) {
  if (!db) initialize();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Execute multiple queries in a transaction
 * @param {Array} operations - Array of {sql, params} objects
 * @returns {Array} Results of all operations
 */
function transaction(operations) {
  if (!db) initialize();

  const txn = db.transaction(() => {
    const results = [];
    for (const op of operations) {
      const stmt = db.prepare(op.sql);
      results.push(stmt.run(...(op.params || [])));
    }
    return results;
  });

  return txn();
}

/**
 * Close the database connection
 */
function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initialize,
  query,
  execute,
  transaction,
  close,
};
