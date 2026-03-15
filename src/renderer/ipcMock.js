/**
 * Mock IPC layer for browser environment
 * This shims window.api when running in a standard browser (not Electron).
 * It redirects all window.api.* calls to the Vite middleware via fetch.
 */

// These match the channel strings in src/main/ipc/channels.js
const CHANNELS = {
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_SAVE_ONE: 'settings:saveOne',
  DASHBOARD_GET_SUPPLIER_ADVANCES: 'dashboard:getSupplierAdvances',
  DASHBOARD_GET_ITEMS_STOCK: 'dashboard:getItemsStock',
  DASHBOARD_GET_SUMMARY: 'dashboard:getSummary',
  SUPPLIER_GET_ALL: 'supplier:getAll',
  SUPPLIER_GET_BY_ID: 'supplier:getById',
  SUPPLIER_CREATE: 'supplier:create',
  SUPPLIER_UPDATE: 'supplier:update',
  SUPPLIER_DELETE: 'supplier:delete',
  SUPPLIER_SEARCH: 'supplier:search',
  SUPPLIER_CHECK_NIC: 'supplier:checkNic',
  CUSTOMER_GET_ALL: 'customer:getAll',
  CUSTOMER_GET_BY_ID: 'customer:getById',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  CUSTOMER_SEARCH: 'customer:search',
  CUSTOMER_CHECK_NIC: 'customer:checkNic',
  ITEM_GET_ALL: 'item:getAll',
  ITEM_GET_BY_ID: 'item:getById',
  ITEM_CREATE: 'item:create',
  ITEM_UPDATE: 'item:update',
  ITEM_DELETE: 'item:delete',
  ITEM_SEARCH: 'item:search',
  ITEM_CHECK_NAME: 'item:checkName',
  SALE_GET_ALL: 'sale:getAll',
  SALE_GET_BY_ID: 'sale:getById',
  SALE_CREATE: 'sale:create',
  SALE_UPDATE: 'sale:update',
  SALE_DELETE: 'sale:delete',
  SALE_SEARCH: 'sale:search',
  SALE_GET_NEXT_NUMBER: 'sale:getNextNumber',
  PURCHASE_GET_ALL: 'purchase:getAll',
  PURCHASE_GET_BY_ID: 'purchase:getById',
  PURCHASE_CREATE: 'purchase:create',
  PURCHASE_UPDATE: 'purchase:update',
  PURCHASE_DELETE: 'purchase:delete',
  PURCHASE_SEARCH: 'purchase:search',
  PURCHASE_GET_NEXT_NUMBER: 'purchase:getNextNumber',
  REFERENCE_GET_CITIES: 'reference:getCities',
  REFERENCE_GET_COUNTRIES: 'reference:getCountries',
  REFERENCE_GET_CATEGORIES: 'reference:getCategories',
  APP_GET_VERSION: 'app:getVersion',
  APP_GET_PLATFORM: 'app:getPlatform',
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
};

async function invokeMock(channel, args) {
  try {
    const response = await fetch('/api/ipc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, args }),
    });
    const result = await response.json();
    if (!result.success && result.error) {
      console.error(`Mock IPC Error [${channel}]:`, result.error);
    }
    return result;
  } catch (err) {
    console.error(`Mock IPC Fetch Failed [${channel}]:`, err);
    return { success: false, error: 'Mock IPC Fetch Failed' };
  }
}

if (!window.api) {
  console.warn('Running in Browser mode. Using Mock IPC Layer.');
  window.api = {
    settings: {
      getAll: () => invokeMock(CHANNELS.SETTINGS_GET_ALL),
      save: (key, value) => invokeMock(CHANNELS.SETTINGS_SAVE_ONE, { key, value }),
    },
    dashboard: {
      getSupplierAdvances: () => invokeMock(CHANNELS.DASHBOARD_GET_SUPPLIER_ADVANCES),
      getItemsStock: () => invokeMock(CHANNELS.DASHBOARD_GET_ITEMS_STOCK),
      getSummary: () => invokeMock(CHANNELS.DASHBOARD_GET_SUMMARY),
    },
    suppliers: {
      getAll: () => invokeMock(CHANNELS.SUPPLIER_GET_ALL),
      getById: (id) => invokeMock(CHANNELS.SUPPLIER_GET_BY_ID, id),
      create: (data) => invokeMock(CHANNELS.SUPPLIER_CREATE, data),
      update: (id, data) => invokeMock(CHANNELS.SUPPLIER_UPDATE, { id, data }),
      delete: (id) => invokeMock(CHANNELS.SUPPLIER_DELETE, id),
      search: (name) => invokeMock(CHANNELS.SUPPLIER_SEARCH, name),
      checkNic: (nic, excludeId) => invokeMock(CHANNELS.SUPPLIER_CHECK_NIC, { nic, excludeId }),
    },
    customers: {
      getAll: () => invokeMock(CHANNELS.CUSTOMER_GET_ALL),
      getById: (id) => invokeMock(CHANNELS.CUSTOMER_GET_BY_ID, id),
      create: (data) => invokeMock(CHANNELS.CUSTOMER_CREATE, data),
      update: (id, data) => invokeMock(CHANNELS.CUSTOMER_UPDATE, { id, data }),
      delete: (id) => invokeMock(CHANNELS.CUSTOMER_DELETE, id),
      search: (name) => invokeMock(CHANNELS.CUSTOMER_SEARCH, name),
      checkNic: (nic, excludeId) => invokeMock(CHANNELS.CUSTOMER_CHECK_NIC, { nic, excludeId }),
    },
    items: {
      getAll: () => invokeMock(CHANNELS.ITEM_GET_ALL),
      getById: (id) => invokeMock(CHANNELS.ITEM_GET_BY_ID, id),
      create: (data) => invokeMock(CHANNELS.ITEM_CREATE, data),
      update: (id, data) => invokeMock(CHANNELS.ITEM_UPDATE, { id, data }),
      delete: (id) => invokeMock(CHANNELS.ITEM_DELETE, id),
      search: (name) => invokeMock(CHANNELS.ITEM_SEARCH, name),
      checkName: (name, excludeId) => invokeMock(CHANNELS.ITEM_CHECK_NAME, { name, excludeId }),
    },
    sales: {
      getAll: () => invokeMock(CHANNELS.SALE_GET_ALL),
      getById: (id) => invokeMock(CHANNELS.SALE_GET_BY_ID, id),
      create: (data) => invokeMock(CHANNELS.SALE_CREATE, data),
      update: (id, data) => invokeMock(CHANNELS.SALE_UPDATE, { id, data }),
      delete: (id) => invokeMock(CHANNELS.SALE_DELETE, id),
      search: (filters) => invokeMock(CHANNELS.SALE_SEARCH, filters),
      getNextNumber: () => invokeMock(CHANNELS.SALE_GET_NEXT_NUMBER),
    },
    purchases: {
      getAll: () => invokeMock(CHANNELS.PURCHASE_GET_ALL),
      getById: (id) => invokeMock(CHANNELS.PURCHASE_GET_BY_ID, id),
      create: (data) => invokeMock(CHANNELS.PURCHASE_CREATE, data),
      update: (id, data) => invokeMock(CHANNELS.PURCHASE_UPDATE, { id, data }),
      delete: (id) => invokeMock(CHANNELS.PURCHASE_DELETE, id),
      search: (filters) => invokeMock(CHANNELS.PURCHASE_SEARCH, filters),
      getNextNumber: () => invokeMock(CHANNELS.PURCHASE_GET_NEXT_NUMBER),
    },
    reference: {
      getCities: () => invokeMock(CHANNELS.REFERENCE_GET_CITIES),
      getCountries: () => invokeMock(CHANNELS.REFERENCE_GET_COUNTRIES),
      getCategories: () => invokeMock(CHANNELS.REFERENCE_GET_CATEGORIES),
    },
    app: {
      getVersion: () => invokeMock(CHANNELS.APP_GET_VERSION),
      getPlatform: () => invokeMock(CHANNELS.APP_GET_PLATFORM),
    },
    reports: {
      getClientRecovery: (params) => invokeMock(CHANNELS.REPORT_CLIENT_RECOVERY, params),
      getItemSales: (params) => invokeMock(CHANNELS.REPORT_ITEM_SALES, params),
      getDailySales: (params) => invokeMock(CHANNELS.REPORT_DAILY_SALES, params),
      getLedger: (params) => invokeMock(CHANNELS.REPORT_LEDGER, params),
      getItemPurchases: (params) => invokeMock(CHANNELS.REPORT_ITEM_PURCHASES, params),
      getStock: (params) => invokeMock(CHANNELS.REPORT_STOCK, params),
      getCustomerRegister: (params) => invokeMock(CHANNELS.REPORT_CUSTOMER_REGISTER, params),
      getConcession: (params) => invokeMock(CHANNELS.REPORT_CONCESSION, params),
      getDailyDetails: (params) => invokeMock(CHANNELS.REPORT_DAILY_DETAILS, params),
      getVendorSales: (params) => invokeMock(CHANNELS.REPORT_VENDOR_SALES, params),
      getVendorStockBill: (params) => invokeMock(CHANNELS.REPORT_VENDOR_STOCK_BILL, params),
      getDailyNetSummary: (params) => invokeMock(CHANNELS.REPORT_NET_SUMMARY, params),
      getStockSaleHistory: (params) => invokeMock(CHANNELS.REPORT_STOCK_SALE_HISTORY, params),
    },
    // Events - mock as no-op or simple listeners
    on: (channel, callback) => {
      console.log(`Mock event listener added for: ${channel}`);
    },
    off: (channel, callback) => {
      console.log(`Mock event listener removed for: ${channel}`);
    },
    // Print - mock as simple logs or browser print
    print: {
      preview: (html) => {
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        return Promise.resolve({ success: true });
      },
      exportPDF: () => Promise.resolve({ success: false, error: 'PDF Export not supported in browser mock' }),
      exportExcel: () => Promise.resolve({ success: false, error: 'Excel Export not supported in browser mock' }),
    }
  };
}
