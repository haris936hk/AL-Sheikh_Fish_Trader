-- Migration v4: Supplier Bills - Add missing fields from original system
-- - Add vehicle_number column
-- - Add drugs_charges (منشیانا) column
-- - Rename grocery_charges → fare_charges (کرایہ)

-- Step 1: Add vehicle_number column
ALTER TABLE supplier_bills ADD COLUMN vehicle_number TEXT;

-- Step 2: Add drugs_charges column
ALTER TABLE supplier_bills ADD COLUMN drugs_charges REAL DEFAULT 0;

-- Step 3: Rename grocery_charges → fare_charges
-- SQLite doesn't support RENAME COLUMN in older versions, so we add fare_charges
-- and copy data, then we'll use fare_charges going forward
ALTER TABLE supplier_bills ADD COLUMN fare_charges REAL DEFAULT 0;
UPDATE supplier_bills SET fare_charges = COALESCE(grocery_charges, 0);
