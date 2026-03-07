const db = require('./index');

/**
 * Database migration system
 * Manages schema versioning and upgrades
 */

const migrations = [
  // Migration 1 -> 2 (example)
  {
    version: 2,
    up: (_database) => {
      _database.exec(`
        -- Add example column to users table
        ALTER TABLE users ADD COLUMN last_login DATETIME;
      `);
    },
    down: (_database) => {
      // SQLite doesn't support DROP COLUMN easily
      // Would need to recreate table
    },
  },
  // Migration 2 -> 3: Add supplier_bill_id to sale_items (FR-SUPBILL-035)
  {
    version: 3,
    up: (_database) => {
      _database.exec(`
        ALTER TABLE sale_items ADD COLUMN supplier_bill_id INTEGER DEFAULT NULL REFERENCES supplier_bills(id);
        CREATE INDEX IF NOT EXISTS idx_sale_items_supplier_bill ON sale_items(supplier_bill_id);
      `);
    },
    down: (_database) => {
      // SQLite doesn't support DROP COLUMN easily
      // Would need to recreate table
    },
  },
  // Add more migrations here as needed
];

/**
 * Get current schema version
 */
function getCurrentVersion() {
  const result = db.query('SELECT MAX(version) as version FROM schema_versions');
  return result[0]?.version || 0;
}

/**
 * Run all pending migrations
 */
function migrate() {
  const currentVersion = getCurrentVersion();
  console.log('Current database version:', currentVersion);

  const pendingMigrations = migrations.filter((m) => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    console.log('Database is up to date');
    return;
  }

  console.log(`Running ${pendingMigrations.length} migration(s)...`);

  for (const migration of pendingMigrations) {
    console.log(`Applying migration ${migration.version}...`);

    try {
      migration.up(db);
      db.execute('INSERT INTO schema_versions (version) VALUES (?)', [migration.version]);
      console.log(`Migration ${migration.version} completed`);
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }
}

module.exports = {
  migrate,
  getCurrentVersion,
};
