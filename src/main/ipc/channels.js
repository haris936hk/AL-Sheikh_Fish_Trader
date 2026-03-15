// IPC Channel Definitions
// This file centralizes all IPC channel names to prevent typos and ensure consistency

module.exports = {
  // Domain-specific channels
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_SAVE_ONE: 'settings:saveOne',

  // Dashboard channels
  DASHBOARD_GET_SUPPLIER_ADVANCES: 'dashboard:getSupplierAdvances',
  DASHBOARD_GET_ITEMS_STOCK: 'dashboard:getItemsStock',
  DASHBOARD_GET_SUMMARY: 'dashboard:getSummary',

  // Supplier channels
  SUPPLIER_GET_ALL: 'supplier:getAll',
  SUPPLIER_GET_BY_ID: 'supplier:getById',
  SUPPLIER_CREATE: 'supplier:create',
  SUPPLIER_UPDATE: 'supplier:update',
  SUPPLIER_DELETE: 'supplier:delete',
  SUPPLIER_SEARCH: 'supplier:search',
  SUPPLIER_CHECK_NIC: 'supplier:checkNic',

  // Customer channels
  CUSTOMER_GET_ALL: 'customer:getAll',
  CUSTOMER_GET_BY_ID: 'customer:getById',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  CUSTOMER_SEARCH: 'customer:search',
  CUSTOMER_CHECK_NIC: 'customer:checkNic',

  // Supplier Bill channels
  SUPPLIER_BILL_GET_ALL: 'supplierBill:getAll',
  SUPPLIER_BILL_GET_BY_ID: 'supplierBill:getById',
  SUPPLIER_BILL_CREATE: 'supplierBill:create',
  SUPPLIER_BILL_UPDATE: 'supplierBill:update',
  SUPPLIER_BILL_DELETE: 'supplierBill:delete',
  SUPPLIER_BILL_GENERATE_PREVIEW: 'supplierBill:generatePreview',
  SUPPLIER_BILL_GET_NEXT_NUMBER: 'supplierBill:getNextNumber',

  // Item channels
  ITEM_GET_ALL: 'item:getAll',
  ITEM_GET_BY_ID: 'item:getById',
  ITEM_CREATE: 'item:create',
  ITEM_UPDATE: 'item:update',
  ITEM_DELETE: 'item:delete',
  ITEM_SEARCH: 'item:search',
  ITEM_CHECK_NAME: 'item:checkName',

  // Sale channels
  SALE_GET_ALL: 'sale:getAll',
  SALE_GET_BY_ID: 'sale:getById',
  SALE_CREATE: 'sale:create',
  SALE_UPDATE: 'sale:update',
  SALE_DELETE: 'sale:delete',
  SALE_SEARCH: 'sale:search',
  SALE_GET_NEXT_NUMBER: 'sale:getNextNumber',

  // Purchase channels
  PURCHASE_GET_ALL: 'purchase:getAll',
  PURCHASE_GET_BY_ID: 'purchase:getById',
  PURCHASE_CREATE: 'purchase:create',
  PURCHASE_UPDATE: 'purchase:update',
  PURCHASE_DELETE: 'purchase:delete',
  PURCHASE_SEARCH: 'purchase:search',
  PURCHASE_GET_NEXT_NUMBER: 'purchase:getNextNumber',

  // Reference data channels
  REFERENCE_GET_CITIES: 'reference:getCities',
  REFERENCE_GET_COUNTRIES: 'reference:getCountries',
  REFERENCE_GET_CATEGORIES: 'reference:getCategories',

  // App channels
  APP_GET_VERSION: 'app:getVersion',
  APP_GET_PLATFORM: 'app:getPlatform',
  APP_GET_PATH: 'app:getPath',

  // Report channels
  REPORT_CLIENT_RECOVERY: 'report:clientRecovery',
  REPORT_ITEM_SALES: 'report:itemSales',
  REPORT_DAILY_SALES: 'report:dailySales',
  REPORT_LEDGER: 'report:ledger',
  REPORT_ITEM_PURCHASES: 'report:itemPurchases',
  REPORT_STOCK: 'report:stock',
  REPORT_CUSTOMER_REGISTER: 'report:customerRegister',
  REPORT_CONCESSION: 'report:concession',
  REPORT_DAILY_DETAILS: 'report:dailyDetails',
  REPORT_VENDOR_SALES: 'report:vendorSales',
  REPORT_VENDOR_STOCK_BILL: 'report:vendorStockBill',
  REPORT_NET_SUMMARY: 'report:netSummary',
  REPORT_STOCK_SALE_HISTORY: 'report:stockSaleHistory',

  // Print/Export channels (FR-PRINT-001 through FR-PRINT-012)
  PRINT_REPORT: 'print:report',
  PRINT_PREVIEW: 'print:preview',
  EXPORT_PDF: 'export:pdf',
  EXPORT_PDF_SILENT: 'export:pdf-silent',
  EXPORT_EXCEL: 'export:excel',
  EXPORT_CSV: 'export:csv',

  // Backup/Restore channels (FR-ADMIN-004)
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_LIST: 'backup:list',

  // Year-End Processing channels (FR-ADMIN-007)
  YEAR_END_GET_PREVIEW: 'yearEnd:getPreview',
  YEAR_END_PROCESS: 'yearEnd:process',
  YEAR_END_GET_HISTORY: 'yearEnd:getHistory',

  // Events (main -> renderer)
  DB_UPDATED: 'db:updated',
};
