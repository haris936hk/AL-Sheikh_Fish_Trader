const { ipcMain, app, BrowserWindow } = require('electron');
const channels = require('./channels.js');
const db = require('../database/index.js');
const queries = require('../database/queries.js');
const printService = require('../services/printService.js');

/**
 * Register all IPC handlers
 */
function registerHandlers() {
  // Database handlers
  // Settings handlers
  ipcMain.handle(channels.SETTINGS_GET_ALL, async () => {
    try {
      const result = db.query('SELECT key, value FROM settings');
      return { success: true, data: result };
    } catch (error) {
      console.error('Settings fetch error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SETTINGS_SAVE_ONE, async (event, { key, value }) => {
    try {
      const result = db.execute(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
        [key, value, value]
      );
      return { success: true, data: result };
    } catch (error) {
      console.error('Settings save error:', error);
      return { success: false, error: error.message };
    }
  });

  // Dashboard handlers
  ipcMain.handle(channels.DASHBOARD_GET_SUPPLIER_ADVANCES, async () => {
    try {
      const result = queries.dashboard.getSupplierAdvances();
      return { success: true, data: result };
    } catch (error) {
      console.error('Dashboard supplier advances error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.DASHBOARD_GET_ITEMS_STOCK, async () => {
    try {
      const result = queries.dashboard.getItemsStock();
      return { success: true, data: result };
    } catch (error) {
      console.error('Dashboard items stock error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.DASHBOARD_GET_SUMMARY, async () => {
    try {
      const result = queries.dashboard.getSummary();
      return { success: true, data: result };
    } catch (error) {
      console.error('Dashboard summary error:', error);
      return { success: false, error: error.message };
    }
  });

  // Supplier handlers
  ipcMain.handle(channels.SUPPLIER_GET_ALL, async () => {
    try {
      const result = queries.suppliers.getAll();
      return { success: true, data: result };
    } catch (error) {
      console.error('Supplier getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SUPPLIER_GET_BY_ID, async (event, id) => {
    try {
      const result = queries.suppliers.getById(id);
      if (!result) {
        return { success: false, error: 'Supplier not found' };
      }
      return { success: true, data: result };
    } catch (error) {
      console.error('Supplier getById error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SUPPLIER_CREATE, async (event, data) => {
    try {
      // Check for duplicate NIC if provided
      if (data.nic && queries.suppliers.checkNic(data.nic)) {
        return { success: false, error: 'A supplier with this NIC already exists' };
      }
      const result = queries.suppliers.create(data);
      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (error) {
      console.error('Supplier create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SUPPLIER_UPDATE, async (event, { id, data }) => {
    try {
      // Check for duplicate NIC if provided (excluding current supplier)
      if (data.nic && queries.suppliers.checkNic(data.nic, id)) {
        return { success: false, error: 'A supplier with this NIC already exists' };
      }
      queries.suppliers.update(id, data);
      return { success: true };
    } catch (error) {
      console.error('Supplier update error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SUPPLIER_DELETE, async (event, id) => {
    try {
      // Check if supplier has transactions
      if (queries.suppliers.hasTransactions(id)) {
        return {
          success: false,
          error:
            'Cannot delete supplier with existing transactions. Consider deactivating instead.',
        };
      }
      queries.suppliers.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Supplier delete error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SUPPLIER_SEARCH, async (event, name) => {
    try {
      const result = queries.suppliers.search(name || '');
      return { success: true, data: result };
    } catch (error) {
      console.error('Supplier search error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SUPPLIER_CHECK_NIC, async (event, { nic, excludeId }) => {
    try {
      const exists = queries.suppliers.checkNic(nic, excludeId);
      return { success: true, data: { exists } };
    } catch (error) {
      console.error('Supplier checkNic error:', error);
      return { success: false, error: error.message };
    }
  });

  // Customer handlers
  ipcMain.handle(channels.CUSTOMER_GET_ALL, async () => {
    try {
      const result = queries.customers.getAll();
      return { success: true, data: result };
    } catch (error) {
      console.error('Customer getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.CUSTOMER_GET_BY_ID, async (event, id) => {
    try {
      const result = queries.customers.getById(id);
      if (!result) {
        return { success: false, error: 'Customer not found' };
      }
      return { success: true, data: result };
    } catch (error) {
      console.error('Customer getById error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.CUSTOMER_CREATE, async (event, data) => {
    try {
      // Check for duplicate NIC if provided
      if (data.nic && queries.customers.checkNic(data.nic)) {
        return { success: false, error: 'A customer with this NIC already exists' };
      }
      const result = queries.customers.create(data);
      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (error) {
      console.error('Customer create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.CUSTOMER_UPDATE, async (event, { id, data }) => {
    try {
      // Check for duplicate NIC if provided (excluding current customer)
      if (data.nic && queries.customers.checkNic(data.nic, id)) {
        return { success: false, error: 'A customer with this NIC already exists' };
      }
      queries.customers.update(id, data);
      return { success: true };
    } catch (error) {
      console.error('Customer update error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.CUSTOMER_DELETE, async (event, id) => {
    try {
      // Check if customer has transactions
      if (queries.customers.hasTransactions(id)) {
        return {
          success: false,
          error:
            'Cannot delete customer with existing transactions. Consider deactivating instead.',
        };
      }
      queries.customers.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Customer delete error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.CUSTOMER_SEARCH, async (event, name) => {
    try {
      const result = queries.customers.search(name || '');
      return { success: true, data: result };
    } catch (error) {
      console.error('Customer search error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.CUSTOMER_CHECK_NIC, async (event, { nic, excludeId }) => {
    try {
      const exists = queries.customers.checkNic(nic, excludeId);
      return { success: true, data: { exists } };
    } catch (error) {
      console.error('Customer checkNic error:', error);
      return { success: false, error: error.message };
    }
  });

  // Reference data handlers
  ipcMain.handle(channels.REFERENCE_GET_CITIES, async () => {
    try {
      const result = queries.reference.getCities();
      return { success: true, data: result };
    } catch (error) {
      console.error('Reference getCities error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REFERENCE_GET_COUNTRIES, async () => {
    try {
      const result = queries.reference.getCountries();
      return { success: true, data: result };
    } catch (error) {
      console.error('Reference getCountries error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REFERENCE_GET_CATEGORIES, async () => {
    try {
      const result = queries.reference.getCategories();
      return { success: true, data: result };
    } catch (error) {
      console.error('Reference getCategories error:', error);
      return { success: false, error: error.message };
    }
  });

  // Supplier Bill handlers
  ipcMain.handle(channels.SUPPLIER_BILL_GET_ALL, async () => {
    try {
      const result = queries.supplierBills.getAll();
      return { success: true, data: result };
    } catch (error) {
      console.error('Supplier Bill getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SUPPLIER_BILL_GET_BY_ID, async (event, id) => {
    try {
      const result = queries.supplierBills.getById(id);
      if (!result) {
        return { success: false, error: 'Supplier bill not found' };
      }
      return { success: true, data: result };
    } catch (error) {
      console.error('Supplier Bill getById error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SUPPLIER_BILL_CREATE, async (event, data) => {
    try {
      const result = queries.supplierBills.create(data);
      return { success: true, data: { id: result.lastInsertRowid, billNumber: result.billNumber } };
    } catch (error) {
      console.error('Supplier Bill create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SUPPLIER_BILL_UPDATE, async (event, { id, data }) => {
    try {
      queries.supplierBills.update(id, data);
      return { success: true };
    } catch (error) {
      console.error('Supplier Bill update error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SUPPLIER_BILL_DELETE, async (event, id) => {
    try {
      queries.supplierBills.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Supplier Bill delete error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    channels.SUPPLIER_BILL_GENERATE_PREVIEW,
    async (event, { supplierId, dateFrom, dateTo }) => {
      try {
        const result = queries.supplierBills.generatePreview(supplierId, dateFrom, dateTo);
        return { success: true, data: result };
      } catch (error) {
        console.error('Supplier Bill generatePreview error:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(channels.SUPPLIER_BILL_GET_NEXT_NUMBER, async () => {
    try {
      const result = queries.supplierBills.getNextBillNumber();
      return { success: true, data: result };
    } catch (error) {
      console.error('Supplier Bill getNextNumber error:', error);
      return { success: false, error: error.message };
    }
  });

  // Item handlers
  ipcMain.handle(channels.ITEM_GET_ALL, async () => {
    try {
      const result = queries.items.getAll();
      return { success: true, data: result };
    } catch (error) {
      console.error('Item getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.ITEM_GET_BY_ID, async (event, id) => {
    try {
      const result = queries.items.getById(id);
      if (!result) {
        return { success: false, error: 'Item not found' };
      }
      return { success: true, data: result };
    } catch (error) {
      console.error('Item getById error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.ITEM_CREATE, async (event, data) => {
    try {
      // Check for duplicate name if provided
      if (data.name && queries.items.checkName(data.name)) {
        return { success: false, error: 'An item with this name already exists' };
      }
      const result = queries.items.create(data);
      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (error) {
      console.error('Item create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.ITEM_UPDATE, async (event, { id, data }) => {
    try {
      // Check for duplicate name if provided (excluding current item)
      if (data.name && queries.items.checkName(data.name, id)) {
        return { success: false, error: 'An item with this name already exists' };
      }
      queries.items.update(id, data);
      return { success: true };
    } catch (error) {
      console.error('Item update error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.ITEM_DELETE, async (event, id) => {
    try {
      // Check if item has transactions
      if (queries.items.hasTransactions(id)) {
        return {
          success: false,
          error: 'Cannot delete item with existing transactions. Consider deactivating instead.',
        };
      }
      queries.items.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Item delete error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.ITEM_SEARCH, async (event, name) => {
    try {
      const result = queries.items.search(name || '');
      return { success: true, data: result };
    } catch (error) {
      console.error('Item search error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.ITEM_CHECK_NAME, async (event, { name, excludeId }) => {
    try {
      const exists = queries.items.checkName(name, excludeId);
      return { success: true, data: { exists } };
    } catch (error) {
      console.error('Item checkName error:', error);
      return { success: false, error: error.message };
    }
  });

  // Sale handlers
  ipcMain.handle(channels.SALE_GET_ALL, async () => {
    try {
      const result = queries.sales.getAll();
      return { success: true, data: result };
    } catch (error) {
      console.error('Sale getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SALE_GET_BY_ID, async (event, id) => {
    try {
      const result = queries.sales.getById(id);
      if (!result) {
        return { success: false, error: 'Sale not found' };
      }
      return { success: true, data: result };
    } catch (error) {
      console.error('Sale getById error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SALE_CREATE, async (event, data) => {
    try {
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'At least one line item is required' };
      }
      const result = queries.sales.create(data);
      return { success: true, data: { id: result.lastInsertRowid, saleNumber: result.saleNumber } };
    } catch (error) {
      console.error('Sale create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SALE_UPDATE, async (event, { id, data }) => {
    try {
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'At least one line item is required' };
      }
      queries.sales.update(id, data);
      return { success: true };
    } catch (error) {
      console.error('Sale update error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SALE_DELETE, async (event, id) => {
    try {
      queries.sales.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Sale delete error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SALE_SEARCH, async (event, filters) => {
    try {
      const result = queries.sales.search(filters || {});
      return { success: true, data: result };
    } catch (error) {
      console.error('Sale search error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.SALE_GET_NEXT_NUMBER, async () => {
    try {
      const result = queries.sales.getNextSaleNumber();
      return { success: true, data: result };
    } catch (error) {
      console.error('Sale getNextNumber error:', error);
      return { success: false, error: error.message };
    }
  });

  // Purchase handlers
  ipcMain.handle(channels.PURCHASE_GET_ALL, async () => {
    try {
      const result = queries.purchases.getAll();
      return { success: true, data: result };
    } catch (error) {
      console.error('Purchase getAll error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.PURCHASE_GET_BY_ID, async (event, id) => {
    try {
      const result = queries.purchases.getById(id);
      if (!result) {
        return { success: false, error: 'Purchase not found' };
      }
      return { success: true, data: result };
    } catch (error) {
      console.error('Purchase getById error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.PURCHASE_CREATE, async (event, data) => {
    try {
      if (!data.supplier_id) {
        return { success: false, error: 'Supplier is required' };
      }
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'At least one line item is required' };
      }
      const result = queries.purchases.create(data);
      return {
        success: true,
        data: { id: result.lastInsertRowid, purchaseNumber: result.purchaseNumber },
      };
    } catch (error) {
      console.error('Purchase create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.PURCHASE_UPDATE, async (event, { id, data }) => {
    try {
      if (!data.supplier_id) {
        return { success: false, error: 'Supplier is required' };
      }
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'At least one line item is required' };
      }
      queries.purchases.update(id, data);
      return { success: true };
    } catch (error) {
      console.error('Purchase update error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.PURCHASE_DELETE, async (event, id) => {
    try {
      queries.purchases.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Purchase delete error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.PURCHASE_SEARCH, async (event, filters) => {
    try {
      const result = queries.purchases.search(filters || {});
      return { success: true, data: result };
    } catch (error) {
      console.error('Purchase search error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.PURCHASE_GET_NEXT_NUMBER, async () => {
    try {
      const result = queries.purchases.getNextPurchaseNumber();
      return { success: true, data: result };
    } catch (error) {
      console.error('Purchase getNextNumber error:', error);
      return { success: false, error: error.message };
    }
  });
  // Report handlers
  ipcMain.handle(channels.REPORT_CLIENT_RECOVERY, async (event, params) => {
    try {
      const { customerId, dateFrom, dateTo, allClients } = params;
      const result = queries.reports.getClientRecovery(customerId, dateFrom, dateTo, allClients);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report clientRecovery error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_ITEM_SALES, async (event, params) => {
    try {
      const { itemId, dateFrom, dateTo } = params;
      const result = queries.reports.getItemSales(itemId, dateFrom, dateTo);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report itemSales error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_DAILY_SALES, async (event, params) => {
    try {
      const { dateFrom, dateTo } = params;
      const result = queries.reports.getDailySales(dateFrom, dateTo);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report dailySales error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_LEDGER, async (event, params) => {
    try {
      const { accountId, accountType, dateFrom, dateTo } = params;
      const result = queries.reports.getLedger(accountId, accountType, dateFrom, dateTo);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report ledger error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_ITEM_PURCHASES, async (event, params) => {
    try {
      const { itemId, dateFrom, dateTo } = params;
      const result = queries.reports.getItemPurchases(itemId, dateFrom, dateTo);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report itemPurchases error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_STOCK, async (event, params) => {
    try {
      const { asOfDate } = params;
      const result = queries.reports.getStockReport(asOfDate);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report stock error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_CUSTOMER_REGISTER, async (event, params) => {
    try {
      const { asOfDate } = params;
      const result = queries.reports.getCustomerRegister(asOfDate);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report customerRegister error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_CONCESSION, async (event, params) => {
    try {
      const { customerId, dateFrom, dateTo, allClients } = params;
      const result = queries.reports.getConcessionReport(customerId, dateFrom, dateTo, allClients);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report concession error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_DAILY_DETAILS, async (event, params) => {
    try {
      const { date } = params;
      const result = queries.reports.getDailySalesDetails(date);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report dailyDetails error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_VENDOR_SALES, async (event, params) => {
    try {
      const { supplierId, dateFrom, dateTo, allVendors } = params;
      const result = queries.reports.getVendorSales(supplierId, dateFrom, dateTo, allVendors);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report vendorSales error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_VENDOR_STOCK_BILL, async (event, params) => {
    try {
      const { supplierId, date } = params;
      const result = queries.reports.getVendorStockBill(supplierId, date);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report vendorStockBill error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.REPORT_NET_SUMMARY, async (event, params) => {
    try {
      const { asOfDate } = params;
      const result = queries.reports.getDailyNetAmountSummary(asOfDate);
      return { success: true, data: result };
    } catch (error) {
      console.error('Report netSummary error:', error);
      return { success: false, error: error.message };
    }
  });

  // App handlers
  ipcMain.handle(channels.APP_GET_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.handle(channels.APP_GET_PLATFORM, () => {
    return process.platform;
  });

  ipcMain.handle(channels.APP_GET_PATH, (event, name) => {
    return app.getPath(name);
  });

  // Print/Export handlers
  ipcMain.handle(channels.PRINT_REPORT, async (event, { htmlContent, options }) => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      await printService.printReport(mainWindow, htmlContent, options);
      return { success: true };
    } catch (error) {
      console.error('Print report error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.PRINT_PREVIEW, async (event, { htmlContent, options }) => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      await printService.printPreview(mainWindow, htmlContent, options);
      return { success: true };
    } catch (error) {
      console.error('Print preview error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.EXPORT_PDF, async (event, { htmlContent, options }) => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      const filePath = await printService.exportToPDF(mainWindow, htmlContent, options);
      if (!filePath) {
        return { success: false, error: 'Export cancelled' };
      }
      return { success: true, data: { filePath } };
    } catch (error) {
      console.error('Export PDF error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.EXPORT_EXCEL, async (event, { data, options }) => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      const filePath = await printService.exportToExcel(mainWindow, data, options);
      if (!filePath) {
        return { success: false, error: 'Export cancelled' };
      }
      return { success: true, data: { filePath } };
    } catch (error) {
      console.error('Export Excel error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.EXPORT_CSV, async (event, { data, options }) => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      const filePath = await printService.exportToExcel(mainWindow, data, {
        ...options,
        filename: options?.filename || 'export.csv',
      });
      if (!filePath) {
        return { success: false, error: 'Export cancelled' };
      }
      return { success: true, data: { filePath } };
    } catch (error) {
      console.error('Export CSV error:', error);
      return { success: false, error: error.message };
    }
  });

  // Backup handlers
  ipcMain.handle(channels.BACKUP_CREATE, async () => {
    try {
      const result = queries.backup.create();
      return { success: true, data: result };
    } catch (error) {
      console.error('Backup create error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.BACKUP_RESTORE, async (event, { filePath }) => {
    try {
      queries.backup.restore(filePath);
      return { success: true };
    } catch (error) {
      console.error('Backup restore error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.BACKUP_LIST, async () => {
    try {
      const result = queries.backup.list();
      return { success: true, data: result };
    } catch (error) {
      console.error('Backup list error:', error);
      return { success: false, error: error.message };
    }
  });

  // Year-End Processing handlers
  ipcMain.handle(channels.YEAR_END_GET_PREVIEW, async (event, { asOfDate }) => {
    try {
      const result = queries.yearEnd.getPreview(asOfDate);
      return { success: true, data: result };
    } catch (error) {
      console.error('Year-end preview error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.YEAR_END_PROCESS, async (event, { closingDate }) => {
    try {
      const result = queries.yearEnd.process(closingDate);
      return { success: true, data: result };
    } catch (error) {
      console.error('Year-end process error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.YEAR_END_GET_HISTORY, async () => {
    try {
      const result = queries.yearEnd.getHistory();
      return { success: true, data: result };
    } catch (error) {
      console.error('Year-end history error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerHandlers };
