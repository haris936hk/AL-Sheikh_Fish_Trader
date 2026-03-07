-- ============================================================================
-- Migration v3: Restructure sale_items to match original system
-- - Add customer_id per line item (گابک)
-- - Add rate_per_maund (ریٹ فی من)
-- - Rename grocery_charges → fare_charges (کرایہ)
-- - Simplify weight columns (remove gross/tare, keep single weight)
-- ============================================================================

-- Step 1: Recreate sale_items with new structure
CREATE TABLE IF NOT EXISTS sale_items_new (
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

-- Step 2: Copy data from old table (map gross_weight-tare_weight → weight, grocery → fare)
INSERT INTO sale_items_new (
    id, sale_id, line_number, item_id, customer_id, is_stock,
    rate_per_maund, rate, weight, amount,
    fare_charges, ice_charges, other_charges,
    cash_amount, receipt_amount, notes, supplier_bill_id, created_at
)
SELECT
    si.id, si.sale_id, si.line_number, si.item_id,
    s.customer_id,  -- inherit customer from sale header
    0,              -- is_stock default false
    si.rate * 40,   -- back-calculate rate_per_maund from rate/kg
    si.rate,
    COALESCE(si.net_weight, si.gross_weight - COALESCE(si.tare_weight, 0), 0),
    si.amount,
    COALESCE(si.grocery_charges, 0),  -- rename grocery → fare
    si.ice_charges,
    si.other_charges,
    si.cash_amount, si.receipt_amount, si.notes, si.supplier_bill_id, si.created_at
FROM sale_items si
JOIN sales s ON si.sale_id = s.id;

-- Step 3: Drop old table and rename new
DROP TABLE IF EXISTS sale_items;
ALTER TABLE sale_items_new RENAME TO sale_items;

-- Step 4: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_item ON sale_items(item_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_customer ON sale_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_supplier_bill ON sale_items(supplier_bill_id);

-- Step 5: Rename grocery_charges → fare_charges in sales header
-- SQLite doesn't support RENAME COLUMN before 3.25, so just add the new column
ALTER TABLE sales ADD COLUMN fare_charges REAL DEFAULT 0;
UPDATE sales SET fare_charges = COALESCE(grocery_charges, 0);

-- Step 6: Record migration
INSERT OR IGNORE INTO schema_versions (version, description)
VALUES (3, 'Restructure sale_items: add customer_id, rate_per_maund, fare_charges; simplify weight');
