-- ============================================================================
-- AL-SHEIKH FISH TRADER AND DISTRIBUTER
-- SQLite Database Schema v2.0
-- Generated: 2026-02-06
-- Based on: Requirements.md (480+ functional requirements)
-- ============================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- SECTION 1: REFERENCE/LOOKUP TABLES
-- ============================================================================

-- Country Table
CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_urdu TEXT,
    code TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- City Table
CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_urdu TEXT,
    country_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

-- Category Table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_urdu TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 2: MASTER TABLES
-- ============================================================================

-- Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    full_name_urdu TEXT,
    email TEXT,
    phone TEXT,
    is_active INTEGER DEFAULT 1,
    last_login_at DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
    created_by INTEGER,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (country_id) REFERENCES countries(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
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
    created_by INTEGER,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (country_id) REFERENCES countries(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
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
    created_by INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================================
-- SECTION 3: BILLING & FINANCIAL
-- (Moved before Sales so that sale_items can reference supplier_bills)
-- ============================================================================

-- Supplier Bills
CREATE TABLE IF NOT EXISTS supplier_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL,
    vehicle_number TEXT,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    total_weight REAL DEFAULT 0,
    gross_amount REAL DEFAULT 0,
    commission_pct REAL DEFAULT 5.0,
    commission_amount REAL DEFAULT 0,
    drugs_charges REAL DEFAULT 0,
    fare_charges REAL DEFAULT 0,
    labor_charges REAL DEFAULT 0,
    ice_charges REAL DEFAULT 0,
    other_charges REAL DEFAULT 0,
    total_charges REAL DEFAULT 0,
    total_payable REAL DEFAULT 0,
    concession_amount REAL DEFAULT 0,
    cash_paid REAL DEFAULT 0,
    collection_amount REAL DEFAULT 0,
    balance_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Payments (Receipts and Payments)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_number TEXT NOT NULL UNIQUE,
    payment_date DATE NOT NULL,
    payment_type TEXT NOT NULL,
    account_type TEXT NOT NULL,
    customer_id INTEGER,
    supplier_id INTEGER,
    amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    reference TEXT,
    description TEXT,
    balance_after REAL DEFAULT 0,
    status TEXT DEFAULT 'posted',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================================
-- SECTION 4: SALES TRANSACTIONS
-- ============================================================================

-- Sales Table (Header)
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_number TEXT NOT NULL UNIQUE,
    sale_date DATE NOT NULL,
    customer_id INTEGER NOT NULL,
    supplier_id INTEGER,
    vehicle_number TEXT,
    details TEXT,
    total_weight REAL DEFAULT 0,
    total_tare_weight REAL DEFAULT 0,
    net_weight REAL DEFAULT 0,
    gross_amount REAL DEFAULT 0,
    fare_charges REAL DEFAULT 0,
    ice_charges REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    net_amount REAL DEFAULT 0,
    cash_received REAL DEFAULT 0,
    receipt_amount REAL DEFAULT 0,
    balance_amount REAL DEFAULT 0,
    previous_balance REAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    posted_at DATETIME,
    posted_by INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (posted_by) REFERENCES users(id)
);

-- Sale Line Items
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    line_number INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    customer_id INTEGER,
    is_stock INTEGER DEFAULT 0,
    rate_per_maund REAL DEFAULT 0,
    rate REAL NOT NULL,
    weight REAL NOT NULL,
    amount REAL NOT NULL,
    fare_charges REAL DEFAULT 0,
    ice_charges REAL DEFAULT 0,
    other_charges REAL DEFAULT 0,
    cash_amount REAL DEFAULT 0,
    receipt_amount REAL DEFAULT 0,
    notes TEXT,
    supplier_bill_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (supplier_bill_id) REFERENCES supplier_bills(id)
);

-- ============================================================================
-- SECTION 5: PURCHASE TRANSACTIONS
-- ============================================================================

-- Purchases Table (Header)
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_number TEXT NOT NULL UNIQUE,
    purchase_date DATE NOT NULL,
    supplier_id INTEGER NOT NULL,
    vehicle_number TEXT,
    details TEXT,
    total_weight REAL DEFAULT 0,
    gross_amount REAL DEFAULT 0,
    concession_amount REAL DEFAULT 0,
    net_amount REAL DEFAULT 0,
    cash_paid REAL DEFAULT 0,
    previous_balance REAL DEFAULT 0,
    balance_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    posted_at DATETIME,
    posted_by INTEGER,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (posted_by) REFERENCES users(id)
);

-- Purchase Line Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    line_number INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    weight REAL NOT NULL,
    rate REAL NOT NULL,
    amount REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- ============================================================================
-- SECTION 7: SYSTEM CONFIGURATION
-- ============================================================================

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

-- Number Sequences
CREATE TABLE IF NOT EXISTS number_sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL,
    current_number INTEGER DEFAULT 0,
    number_length INTEGER DEFAULT 6,
    reset_yearly INTEGER DEFAULT 0,
    last_reset_date DATE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Schema Versions
CREATE TABLE IF NOT EXISTS schema_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL,
    description TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 8: INDEXES
-- ============================================================================

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city_id);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

-- Items
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active);

-- Sales
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_supplier ON sales(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- Sale Items
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_item ON sale_items(item_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_customer ON sale_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_supplier_bill ON sale_items(supplier_bill_id);

-- Purchases
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- Purchase Items
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_item ON purchase_items(item_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_supplier ON payments(supplier_id);

-- Settings
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================================================
-- SECTION 9: DEFAULT DATA
-- ============================================================================

-- Insert schema version
INSERT OR IGNORE INTO schema_versions (version, description) VALUES (2, 'Full schema with all entities');

-- Default country
INSERT OR IGNORE INTO countries (id, name, name_urdu, code) VALUES (1, 'Pakistan', 'پاکستان', 'PAK');

-- Default cities
INSERT OR IGNORE INTO cities (id, name, name_urdu, country_id) VALUES 
    (1, 'Rawalpindi', 'راولپنڈی', 1),
    (2, 'Islamabad', 'اسلام آباد', 1),
    (3, 'Lahore', 'لاہور', 1),
    (4, 'Karachi', 'کراچی', 1);

-- Default settings
INSERT OR IGNORE INTO settings (key, value, description) VALUES 
    ('company_name', 'AL - SHEIKH FISH TRADER AND DISTRIBUTER', 'Company display name'),
    ('company_name_urdu', 'اے ایل شیخ فش ٹریڈر اینڈ ڈسٹری بیوٹر', 'Company name in Urdu'),
    ('company_address', 'Shop No. W-644 Gunj Mandi Rawalpindi', 'Company address'),
    ('company_phone1', '+92-3008501724', 'Primary phone number'),
    ('company_phone2', '051-5534607', 'Secondary phone number'),
    ('default_commission_pct', '5.00', 'Default commission percentage'),
    ('session_timeout_minutes', '30', 'User session timeout'),
    ('date_format', 'dd-MM-yyyy', 'Default date format'),
    ('currency_symbol', 'Rs.', 'Currency symbol'),
    ('weight_unit', 'kg', 'Default weight unit'),
    ('app_theme', 'light', 'Application theme'),
    ('app_language', 'ur', 'Application language');

-- Default number sequences
INSERT OR IGNORE INTO number_sequences (name, prefix, current_number) VALUES 
    ('sale', 'SL-', 0),
    ('purchase', 'PO-', 0),
    ('payment', 'PAY-', 0),
    ('receipt', 'REC-', 0),
    ('supplier_bill', 'BILL-', 0);

-- Default admin user (password: admin123 - should be changed)
INSERT OR IGNORE INTO users (id, username, password_hash, full_name) 
VALUES (1, 'admin', '$2b$10$placeholder_hash_change_this', 'Administrator');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
