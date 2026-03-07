// Preload script - secure bridge between main and renderer
// See: https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');
const channels = require('./ipc/channels.js');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Database operations
  // Domain-specific APIs
  settings: {
    getAll: () => ipcRenderer.invoke(channels.SETTINGS_GET_ALL),
    save: (key, value) => ipcRenderer.invoke(channels.SETTINGS_SAVE_ONE, { key, value }),
  },

  // Dashboard APIs
  dashboard: {
    getSupplierAdvances: () => ipcRenderer.invoke(channels.DASHBOARD_GET_SUPPLIER_ADVANCES),
    getItemsStock: () => ipcRenderer.invoke(channels.DASHBOARD_GET_ITEMS_STOCK),
    getSummary: () => ipcRenderer.invoke(channels.DASHBOARD_GET_SUMMARY),
  },

  // Supplier APIs
  suppliers: {
    getAll: () => ipcRenderer.invoke(channels.SUPPLIER_GET_ALL),
    getById: (id) => ipcRenderer.invoke(channels.SUPPLIER_GET_BY_ID, id),
    create: (data) => ipcRenderer.invoke(channels.SUPPLIER_CREATE, data),
    update: (id, data) => ipcRenderer.invoke(channels.SUPPLIER_UPDATE, { id, data }),
    delete: (id) => ipcRenderer.invoke(channels.SUPPLIER_DELETE, id),
    search: (name) => ipcRenderer.invoke(channels.SUPPLIER_SEARCH, name),
    checkNic: (nic, excludeId) =>
      ipcRenderer.invoke(channels.SUPPLIER_CHECK_NIC, { nic, excludeId }),
  },

  // Customer APIs
  customers: {
    getAll: () => ipcRenderer.invoke(channels.CUSTOMER_GET_ALL),
    getById: (id) => ipcRenderer.invoke(channels.CUSTOMER_GET_BY_ID, id),
    create: (data) => ipcRenderer.invoke(channels.CUSTOMER_CREATE, data),
    update: (id, data) => ipcRenderer.invoke(channels.CUSTOMER_UPDATE, { id, data }),
    delete: (id) => ipcRenderer.invoke(channels.CUSTOMER_DELETE, id),
    search: (name) => ipcRenderer.invoke(channels.CUSTOMER_SEARCH, name),
    checkNic: (nic, excludeId) =>
      ipcRenderer.invoke(channels.CUSTOMER_CHECK_NIC, { nic, excludeId }),
  },

  // Supplier Bill APIs
  supplierBills: {
    getAll: () => ipcRenderer.invoke(channels.SUPPLIER_BILL_GET_ALL),
    getById: (id) => ipcRenderer.invoke(channels.SUPPLIER_BILL_GET_BY_ID, id),
    create: (data) => ipcRenderer.invoke(channels.SUPPLIER_BILL_CREATE, data),
    update: (id, data) => ipcRenderer.invoke(channels.SUPPLIER_BILL_UPDATE, { id, data }),
    delete: (id) => ipcRenderer.invoke(channels.SUPPLIER_BILL_DELETE, id),
    generatePreview: (supplierId, dateFrom, dateTo) =>
      ipcRenderer.invoke(channels.SUPPLIER_BILL_GENERATE_PREVIEW, {
        supplierId,
        dateFrom,
        dateTo,
      }),
    getNextNumber: () => ipcRenderer.invoke(channels.SUPPLIER_BILL_GET_NEXT_NUMBER),
  },

  // Item APIs
  items: {
    getAll: () => ipcRenderer.invoke(channels.ITEM_GET_ALL),
    getById: (id) => ipcRenderer.invoke(channels.ITEM_GET_BY_ID, id),
    create: (data) => ipcRenderer.invoke(channels.ITEM_CREATE, data),
    update: (id, data) => ipcRenderer.invoke(channels.ITEM_UPDATE, { id, data }),
    delete: (id) => ipcRenderer.invoke(channels.ITEM_DELETE, id),
    search: (name) => ipcRenderer.invoke(channels.ITEM_SEARCH, name),
    checkName: (name, excludeId) =>
      ipcRenderer.invoke(channels.ITEM_CHECK_NAME, { name, excludeId }),
  },

  // Sale APIs
  sales: {
    getAll: () => ipcRenderer.invoke(channels.SALE_GET_ALL),
    getById: (id) => ipcRenderer.invoke(channels.SALE_GET_BY_ID, id),
    create: (data) => ipcRenderer.invoke(channels.SALE_CREATE, data),
    update: (id, data) => ipcRenderer.invoke(channels.SALE_UPDATE, { id, data }),
    delete: (id) => ipcRenderer.invoke(channels.SALE_DELETE, id),
    search: (filters) => ipcRenderer.invoke(channels.SALE_SEARCH, filters),
    getNextNumber: () => ipcRenderer.invoke(channels.SALE_GET_NEXT_NUMBER),
  },

  // Purchase APIs
  purchases: {
    getAll: () => ipcRenderer.invoke(channels.PURCHASE_GET_ALL),
    getById: (id) => ipcRenderer.invoke(channels.PURCHASE_GET_BY_ID, id),
    create: (data) => ipcRenderer.invoke(channels.PURCHASE_CREATE, data),
    update: (id, data) => ipcRenderer.invoke(channels.PURCHASE_UPDATE, { id, data }),
    delete: (id) => ipcRenderer.invoke(channels.PURCHASE_DELETE, id),
    search: (filters) => ipcRenderer.invoke(channels.PURCHASE_SEARCH, filters),
    getNextNumber: () => ipcRenderer.invoke(channels.PURCHASE_GET_NEXT_NUMBER),
  },

  // Reference data APIs
  reference: {
    getCities: () => ipcRenderer.invoke(channels.REFERENCE_GET_CITIES),
    getCountries: () => ipcRenderer.invoke(channels.REFERENCE_GET_COUNTRIES),
    getCategories: () => ipcRenderer.invoke(channels.REFERENCE_GET_CATEGORIES),
  },

  // App utilities
  app: {
    getVersion: () => ipcRenderer.invoke(channels.APP_GET_VERSION),
    getPlatform: () => ipcRenderer.invoke(channels.APP_GET_PLATFORM),
    getPath: (name) => ipcRenderer.invoke(channels.APP_GET_PATH, name),
  },

  // Reports
  reports: {
    getClientRecovery: (params) => ipcRenderer.invoke(channels.REPORT_CLIENT_RECOVERY, params),
    getItemSales: (params) => ipcRenderer.invoke(channels.REPORT_ITEM_SALES, params),
    getDailySales: (params) => ipcRenderer.invoke(channels.REPORT_DAILY_SALES, params),
    getLedger: (params) => ipcRenderer.invoke(channels.REPORT_LEDGER, params),
    getItemPurchases: (params) => ipcRenderer.invoke(channels.REPORT_ITEM_PURCHASES, params),
    getStock: (params) => ipcRenderer.invoke(channels.REPORT_STOCK, params),
    getCustomerRegister: (params) =>
      ipcRenderer.invoke(channels.REPORT_CUSTOMER_REGISTER, params),
    getConcession: (params) => ipcRenderer.invoke(channels.REPORT_CONCESSION, params),
    getDailyDetails: (params) => ipcRenderer.invoke(channels.REPORT_DAILY_DETAILS, params),
    getVendorSales: (params) => ipcRenderer.invoke(channels.REPORT_VENDOR_SALES, params),
    getVendorStockBill: (params) =>
      ipcRenderer.invoke(channels.REPORT_VENDOR_STOCK_BILL, params),
    getDailyNetSummary: (params) => ipcRenderer.invoke(channels.REPORT_NET_SUMMARY, params),
  },

  // Print/Export APIs (FR-PRINT-001 through FR-PRINT-012)
  print: {
    report: (htmlContent, options) =>
      ipcRenderer.invoke(channels.PRINT_REPORT, { htmlContent, options }),
    preview: (htmlContent, options) =>
      ipcRenderer.invoke(channels.PRINT_PREVIEW, { htmlContent, options }),
    exportPDF: (htmlContent, options) =>
      ipcRenderer.invoke(channels.EXPORT_PDF, { htmlContent, options }),
    exportExcel: (data, options) => ipcRenderer.invoke(channels.EXPORT_EXCEL, { data, options }),
    exportCSV: (data, options) => ipcRenderer.invoke(channels.EXPORT_CSV, { data, options }),
  },

  // Backup APIs (FR-ADMIN-004)
  backup: {
    create: () => ipcRenderer.invoke(channels.BACKUP_CREATE),
    restore: (filePath) => ipcRenderer.invoke(channels.BACKUP_RESTORE, { filePath }),
    list: () => ipcRenderer.invoke(channels.BACKUP_LIST),
  },

  // Year-End Processing APIs (FR-ADMIN-007)
  yearEnd: {
    getPreview: (asOfDate) => ipcRenderer.invoke(channels.YEAR_END_GET_PREVIEW, { asOfDate }),
    process: (closingDate) => ipcRenderer.invoke(channels.YEAR_END_PROCESS, { closingDate }),
    getHistory: () => ipcRenderer.invoke(channels.YEAR_END_GET_HISTORY),
  },

  // Event listeners (main -> renderer)
  on: (channel, callback) => {
    // Whitelist channels to prevent security issues
    const validChannels = [channels.DB_UPDATED];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // Remove event listeners
  off: (channel, callback) => {
    const validChannels = [channels.DB_UPDATED];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
});
