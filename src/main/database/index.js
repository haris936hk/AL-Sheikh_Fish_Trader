const fs = require('fs');
const path = require('path');

const Database = require('better-sqlite3');
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
      // Ensure directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      dbPath = path.join(userDataPath, 'database.sqlite');
    }

    console.log('Initializing database at:', dbPath);

    // Create database connection
    db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Try multiple paths for schema.sql (handles both dev and production)
    const appPath = app.getAppPath();
    const possiblePaths = [
      path.join(__dirname, 'schema.sql'),
      path.join(appPath, 'src', 'main', 'database', 'schema.sql'),
      path.join(appPath, 'resources', 'app', 'src', 'main', 'database', 'schema.sql'),
      path.join(process.resourcesPath, 'app', 'src', 'main', 'database', 'schema.sql'),
    ];

    let schemaLoaded = false;
    for (const schemaPath of possiblePaths) {
      if (fs.existsSync(schemaPath)) {
        try {
          console.log('Loading schema from:', schemaPath);
          const schema = fs.readFileSync(schemaPath, 'utf8');
          db.exec(schema);
          console.log('Database schema initialized from:', schemaPath);
          schemaLoaded = true;
          break;
        } catch (err) {
          console.error(`Error loading schema from ${schemaPath}:`, err);
        }
      }
    }

    if (!schemaLoaded) {
      console.warn('Schema file not found or failed to load, trying expanded inline fallback...');
      createFullFallbackSchema();
    }

    return db;
  } catch (error) {
    console.error('CRITICAL: Failed to initialize database:', error);
    db = null; // Reset so next call can try again
    throw error;
  }
}

/**
 * Full fallback schema in case schema.sql is missing.
 * This ensures the app is never in a completely broken state.
 */
function createFullFallbackSchema() {
  db.exec(`
    -- Reference Tables
    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_urdu TEXT,
      code TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_urdu TEXT,
      country_id INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_urdu TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Master Tables
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT NOT NULL,
      name_english TEXT,
      city_id INTEGER,
      country_id INTEGER,
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      advance_amount REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT NOT NULL,
      name_english TEXT,
      city_id INTEGER,
      country_id INTEGER,
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT NOT NULL,
      name_english TEXT,
      category_id INTEGER,
      current_stock REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Transaction Tables
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number TEXT NOT NULL UNIQUE,
      sale_date DATE NOT NULL,
      customer_id INTEGER NOT NULL,
      supplier_id INTEGER,
      net_amount REAL DEFAULT 0,
      cash_received REAL DEFAULT 0,
      status TEXT DEFAULT 'posted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      customer_id INTEGER,
      weight REAL NOT NULL,
      rate REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_number TEXT NOT NULL UNIQUE,
      purchase_date DATE NOT NULL,
      supplier_id INTEGER NOT NULL,
      net_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'posted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      weight REAL NOT NULL,
      rate REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id)
    );

    CREATE TABLE IF NOT EXISTS supplier_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT NOT NULL UNIQUE,
      supplier_id INTEGER NOT NULL,
      date_from DATE NOT NULL,
      date_to DATE NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number TEXT NOT NULL UNIQUE,
      payment_date DATE NOT NULL,
      payment_type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'posted'
    );

    -- System Tables
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS number_sequences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      prefix TEXT NOT NULL,
      current_number INTEGER DEFAULT 0,
      number_length INTEGER DEFAULT 6,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Default Data
    INSERT OR IGNORE INTO countries (id, name, name_urdu) VALUES (1, 'Pakistan', 'پاکستان');
    INSERT OR IGNORE INTO cities (id, name, name_urdu, country_id) VALUES (1, 'Rawalpindi', 'راولپنڈی', 1);
    
    INSERT OR IGNORE INTO settings (key, value) VALUES 
      ('app_theme', 'light'),
      ('app_language', 'ur'),
      ('company_name', 'FISHPLUS Distributor');

    INSERT OR IGNORE INTO number_sequences (name, prefix) VALUES 
      ('sale', 'SL-'),
      ('purchase', 'PO-'),
      ('payment', 'PAY-'),
      ('supplier_bill', 'BILL-');

    INSERT OR IGNORE INTO users (id, username, password_hash, full_name) 
    VALUES (1, 'admin', 'admin', 'Administrator');
  `);
  console.log('Full fallback schema created inline');
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
