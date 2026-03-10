-- Migration V5: Add CHECK constraints to critical tables for data integrity

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- 1. Suppliers
CREATE TABLE IF NOT EXISTS suppliers_new (
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
    default_commission_pct REAL DEFAULT 5.0 CHECK(default_commission_pct >= 0 AND default_commission_pct <= 100),
    is_active INTEGER DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (country_id) REFERENCES countries(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
INSERT INTO suppliers_new SELECT * FROM suppliers;
DROP TABLE suppliers;
ALTER TABLE suppliers_new RENAME TO suppliers;
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_city ON suppliers(city_id);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- 2. Sales
CREATE TABLE IF NOT EXISTS sales_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_number TEXT NOT NULL UNIQUE,
    sale_date DATE NOT NULL CHECK(sale_date <> ''),
    customer_id INTEGER NOT NULL,
    supplier_id INTEGER,
    vehicle_number TEXT,
    details TEXT,
    total_weight REAL DEFAULT 0 CHECK(total_weight >= 0),
    total_tare_weight REAL DEFAULT 0 CHECK(total_tare_weight >= 0),
    net_weight REAL DEFAULT 0 CHECK(net_weight >= 0),
    gross_amount REAL DEFAULT 0 CHECK(gross_amount >= 0),
    fare_charges REAL DEFAULT 0 CHECK(fare_charges >= 0),
    ice_charges REAL DEFAULT 0 CHECK(ice_charges >= 0),
    discount_amount REAL DEFAULT 0 CHECK(discount_amount >= 0),
    net_amount REAL DEFAULT 0 CHECK(net_amount >= 0),
    cash_received REAL DEFAULT 0 CHECK(cash_received >= 0),
    receipt_amount REAL DEFAULT 0 CHECK(receipt_amount >= 0),
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
INSERT INTO sales_new SELECT * FROM sales;
DROP TABLE sales;
ALTER TABLE sales_new RENAME TO sales;
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_supplier ON sales(supplier_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_supplier_date ON sales(supplier_id, sale_date);
CREATE INDEX idx_sales_customer_date ON sales(customer_id, sale_date);

-- 3. Sale Items
CREATE TABLE IF NOT EXISTS sale_items_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    line_number INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    customer_id INTEGER,
    is_stock INTEGER DEFAULT 0,
    rate_per_maund REAL DEFAULT 0 CHECK(rate_per_maund >= 0),
    rate REAL NOT NULL CHECK(rate >= 0),
    weight REAL NOT NULL CHECK(weight > 0),
    amount REAL NOT NULL CHECK(amount >= 0),
    fare_charges REAL DEFAULT 0 CHECK(fare_charges >= 0),
    ice_charges REAL DEFAULT 0 CHECK(ice_charges >= 0),
    other_charges REAL DEFAULT 0 CHECK(other_charges >= 0),
    cash_amount REAL DEFAULT 0 CHECK(cash_amount >= 0),
    receipt_amount REAL DEFAULT 0 CHECK(receipt_amount >= 0),
    notes TEXT,
    supplier_bill_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (supplier_bill_id) REFERENCES supplier_bills(id)
);
INSERT INTO sale_items_new SELECT * FROM sale_items;
DROP TABLE sale_items;
ALTER TABLE sale_items_new RENAME TO sale_items;
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_item ON sale_items(item_id);
CREATE INDEX idx_sale_items_customer ON sale_items(customer_id);
CREATE INDEX idx_sale_items_bill_id ON sale_items(supplier_bill_id);
CREATE INDEX idx_sale_items_supplier_bill ON sale_items(supplier_bill_id);

-- 4. Purchases
CREATE TABLE IF NOT EXISTS purchases_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_number TEXT NOT NULL UNIQUE,
    purchase_date DATE NOT NULL CHECK(purchase_date <> ''),
    supplier_id INTEGER NOT NULL,
    vehicle_number TEXT,
    details TEXT,
    total_weight REAL DEFAULT 0 CHECK(total_weight >= 0),
    gross_amount REAL DEFAULT 0 CHECK(gross_amount >= 0),
    concession_amount REAL DEFAULT 0 CHECK(concession_amount >= 0),
    net_amount REAL DEFAULT 0 CHECK(net_amount >= 0),
    cash_paid REAL DEFAULT 0 CHECK(cash_paid >= 0),
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
INSERT INTO purchases_new SELECT * FROM purchases;
DROP TABLE purchases;
ALTER TABLE purchases_new RENAME TO purchases;
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_supplier_date ON purchases(supplier_id, purchase_date);

-- 5. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    line_number INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    weight REAL NOT NULL CHECK(weight >= 0),
    rate REAL NOT NULL CHECK(rate >= 0),
    amount REAL NOT NULL CHECK(amount >= 0),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);
INSERT INTO purchase_items_new SELECT * FROM purchase_items;
DROP TABLE purchase_items;
ALTER TABLE purchase_items_new RENAME TO purchase_items;
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_item ON purchase_items(item_id);

-- 6. Supplier Bills
CREATE TABLE IF NOT EXISTS supplier_bills_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL,
    vehicle_number TEXT,
    date_from DATE NOT NULL CHECK(date_from <> ''),
    date_to DATE NOT NULL CHECK(date_to <> ''),
    total_weight REAL DEFAULT 0 CHECK(total_weight >= 0),
    gross_amount REAL DEFAULT 0 CHECK(gross_amount >= 0),
    commission_pct REAL DEFAULT 5.0 CHECK(commission_pct >= 0 AND commission_pct <= 100),
    commission_amount REAL DEFAULT 0 CHECK(commission_amount >= 0),
    drugs_charges REAL DEFAULT 0 CHECK(drugs_charges >= 0),
    fare_charges REAL DEFAULT 0 CHECK(fare_charges >= 0),
    labor_charges REAL DEFAULT 0 CHECK(labor_charges >= 0),
    ice_charges REAL DEFAULT 0 CHECK(ice_charges >= 0),
    other_charges REAL DEFAULT 0 CHECK(other_charges >= 0),
    total_charges REAL DEFAULT 0 CHECK(total_charges >= 0),
    total_payable REAL DEFAULT 0 CHECK(total_payable >= 0),
    concession_amount REAL DEFAULT 0 CHECK(concession_amount >= 0),
    cash_paid REAL DEFAULT 0 CHECK(cash_paid >= 0),
    collection_amount REAL DEFAULT 0 CHECK(collection_amount >= 0),
    balance_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
INSERT INTO supplier_bills_new SELECT * FROM supplier_bills;
DROP TABLE supplier_bills;
ALTER TABLE supplier_bills_new RENAME TO supplier_bills;

COMMIT;
PRAGMA foreign_keys=ON;
