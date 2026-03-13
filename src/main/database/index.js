const fs = require('fs');
const path = require('path');

const Database = require('better-sqlite3');
const { app } = require('electron');

let db = null;
const stmtCache = new Map();

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

    // Create database connection with 10s timeout to prevent locking errors
    db = new Database(dbPath, { timeout: 10000 });

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Performance PRAGMAs
    db.pragma('synchronous = NORMAL');   // Safe with WAL; fewer fsync calls
    db.pragma('cache_size = -32000');    // 32 MB page cache (default ~2 MB)
    db.pragma('temp_store = MEMORY');    // Temporary tables/indexes in RAM
    db.pragma('mmap_size = 268435456'); // 256 MB memory-mapped I/O

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
      throw new Error('CRITICAL: Database schema file (schema.sql) not found or failed to load.');
    }

    return db;
  } catch (error) {
    console.error('CRITICAL: Failed to initialize database:', error);
    db = null; // Reset so next call can try again
    throw error;
  }
}


/**
 * Get or create a cached prepared statement
 * @param {string} sql - SQL query
 * @returns {Statement} Prepared statement
 */
function getStmt(sql) {
  if (!db) initialize();
  let stmt = stmtCache.get(sql);
  if (!stmt) {
    stmt = db.prepare(sql);
    stmtCache.set(sql, stmt);
  }
  return stmt;
}

/**
 * Execute a SELECT query (with cached prepared statement)
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Array} Query results
 */
function query(sql, params = []) {
  return getStmt(sql).all(...params);
}

/**
 * Execute an INSERT, UPDATE, or DELETE query (with cached prepared statement)
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object} Result with changes and lastInsertRowid
 */
function execute(sql, params = []) {
  return getStmt(sql).run(...params);
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
      results.push(getStmt(op.sql).run(...(op.params || [])));
    }
    return results;
  });

  return txn();
}

/**
 * Get the raw database instance for advanced operations (e.g. custom transactions)
 * @returns {Database} The better-sqlite3 database instance
 */
function getDb() {
  if (!db) initialize();
  return db;
}

/**
 * Close the database connection
 */
function close() {
  if (db) {
    db.pragma('optimize');  // Gather statistics for query planner before closing
    stmtCache.clear();
    db.close();
    db = null;
  }
}

module.exports = {
  initialize,
  query,
  execute,
  transaction,
  getDb,
  close,
};
