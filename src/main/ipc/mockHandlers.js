const db = require('../database/index.js');
const queries = require('../database/queries.js');

const channels = require('./channels.js');
const validation = require('./ipcValidation.js');

/**
 * A mock IPC handler that mirrors the logic in handlers.js
 * but doesn't depend on Electron's ipcMain.
 */
async function handleMockIpc(channel, args) {
  // Ensure DB is initialized
  try {
    db.initialize();
  } catch (err) {
    return { success: false, error: `DB initialization failed: ${  err.message}` };
  }

  switch (channel) {
    case channels.SETTINGS_GET_ALL:
      try {
        const result = db.query('SELECT key, value FROM settings');
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }

    case channels.SETTINGS_SAVE_ONE:
      try {
        const { key, value } = args;
        const vResult = validation.validateSettingsKey(key);
        if (!vResult.valid) return { success: false, error: vResult.error };
        const result = db.execute(
          `INSERT INTO settings (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
          [key, value, value]
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }

    // Dashboard
    case channels.DASHBOARD_GET_SUPPLIER_ADVANCES:
      return wrap(() => queries.dashboard.getSupplierAdvances());
    case channels.DASHBOARD_GET_ITEMS_STOCK:
      return wrap(() => queries.dashboard.getItemsStock());
    case channels.DASHBOARD_GET_SUMMARY:
      return wrap(() => queries.dashboard.getSummary());

    // Suppliers
    case channels.SUPPLIER_GET_ALL:
      return wrap(() => queries.suppliers.getAll());
    case channels.SUPPLIER_GET_BY_ID:
      return wrap(() => {
        validation.assertInteger(args, 'Supplier ID');
        return queries.suppliers.getById(args);
      });
    case channels.SUPPLIER_CREATE:
      return wrap(() => {
        const vResult = validation.validateSupplierData(args);
        if (!vResult.valid) throw new Error(vResult.error);
        const data = vResult.data;
        if (data.nic && queries.suppliers.checkNic(data.nic)) {
          throw new Error('A supplier with this NIC already exists');
        }
        const result = queries.suppliers.create(data);
        return { id: result.lastInsertRowid };
      });
    case channels.SUPPLIER_UPDATE:
      return wrap(() => {
        const { id, data: rawData } = args;
        validation.assertInteger(id, 'Supplier ID');
        const vResult = validation.validateSupplierData(rawData);
        if (!vResult.valid) throw new Error(vResult.error);
        const data = vResult.data;
        if (data.nic && queries.suppliers.checkNic(data.nic, id)) {
          throw new Error('A supplier with this NIC already exists');
        }
        queries.suppliers.update(id, data);
        return true;
      });
    case channels.SUPPLIER_DELETE:
      return wrap(() => {
        validation.assertInteger(args, 'Supplier ID');
        if (queries.suppliers.hasTransactions(args)) {
          throw new Error('Cannot delete supplier with existing transactions.');
        }
        queries.suppliers.delete(args);
        return true;
      });
    case channels.SUPPLIER_SEARCH:
      return wrap(() => queries.suppliers.search(args || ''));

    // Customers
    case channels.CUSTOMER_GET_ALL:
      return wrap(() => queries.customers.getAll());
    case channels.CUSTOMER_GET_BY_ID:
      return wrap(() => {
        validation.assertInteger(args, 'Customer ID');
        return queries.customers.getById(args);
      });
    case channels.CUSTOMER_CREATE:
      return wrap(() => {
        const vResult = validation.validateCustomerData(args);
        if (!vResult.valid) throw new Error(vResult.error);
        const data = vResult.data;
        if (data.nic && queries.customers.checkNic(data.nic)) {
          throw new Error('A customer with this NIC already exists');
        }
        const result = queries.customers.create(data);
        return { id: result.lastInsertRowid };
      });
    case channels.CUSTOMER_UPDATE:
      return wrap(() => {
        const { id, data: rawData } = args;
        validation.assertInteger(id, 'Customer ID');
        const vResult = validation.validateCustomerData(rawData);
        if (!vResult.valid) throw new Error(vResult.error);
        const data = vResult.data;
        if (data.nic && queries.customers.checkNic(data.nic, id)) {
          throw new Error('A customer with this NIC already exists');
        }
        queries.customers.update(id, data);
        return true;
      });
    case channels.CUSTOMER_DELETE:
      return wrap(() => {
        validation.assertInteger(args, 'Customer ID');
        if (queries.customers.hasTransactions(args)) {
          throw new Error('Cannot delete customer with existing transactions.');
        }
        queries.customers.delete(args);
        return true;
      });
    case channels.CUSTOMER_SEARCH:
      return wrap(() => queries.customers.search(args || ''));

    // Items
    case channels.ITEM_GET_ALL:
      return wrap(() => queries.items.getAll());
    case channels.ITEM_GET_BY_ID:
      return wrap(() => {
        validation.assertInteger(args, 'Item ID');
        return queries.items.getById(args);
      });
    case channels.ITEM_CREATE:
      return wrap(() => {
        const vResult = validation.validateItemData(args);
        if (!vResult.valid) throw new Error(vResult.error);
        const data = vResult.data;
        if (data.name && queries.items.checkName(data.name)) {
          throw new Error('An item with this name already exists');
        }
        const result = queries.items.create(data);
        return { id: result.lastInsertRowid };
      });
    case channels.ITEM_UPDATE:
      return wrap(() => {
        const { id, data: rawData } = args;
        validation.assertInteger(id, 'Item ID');
        const vResult = validation.validateItemData(rawData);
        if (!vResult.valid) throw new Error(vResult.error);
        const data = vResult.data;
        if (data.name && queries.items.checkName(data.name, id)) {
          throw new Error('An item with this name already exists');
        }
        queries.items.update(id, data);
        return true;
      });
    case channels.ITEM_DELETE:
      return wrap(() => {
        validation.assertInteger(args, 'Item ID');
        if (queries.items.hasTransactions(args)) {
          throw new Error('Cannot delete item with transactions.');
        }
        queries.items.delete(args);
        return true;
      });
    case channels.ITEM_SEARCH:
      return wrap(() => queries.items.search(args || ''));

    // Sales
    case channels.SALE_GET_ALL:
      return wrap(() => queries.sales.getAll());
    case channels.SALE_CREATE:
      return wrap(() => {
        const vResult = validation.validateSaleData(args);
        if (!vResult.valid) throw new Error(vResult.error);
        const data = vResult.data;
        const result = queries.sales.create(data);
        return { id: result.lastInsertRowid, saleNumber: result.saleNumber };
      });
    case channels.SALE_GET_BY_ID:
      return wrap(() => {
        validation.assertInteger(args, 'Sale ID');
        return queries.sales.getById(args);
      });
    case channels.SALE_UPDATE:
      return wrap(() => {
        const { id, data: rawData } = args;
        validation.assertInteger(id, 'Sale ID');
        const vResult = validation.validateSaleData(rawData);
        if (!vResult.valid) throw new Error(vResult.error);
        queries.sales.update(id, vResult.data);
        return true;
      });
    case channels.SALE_DELETE:
      return wrap(() => {
        validation.assertInteger(args, 'Sale ID');
        queries.sales.delete(args);
        return true;
      });
    case channels.SALE_SEARCH:
      return wrap(() => queries.sales.search(args || {}));
    case channels.SALE_GET_NEXT_NUMBER:
      return wrap(() => queries.sales.getNextSaleNumber());

    // Purchases
    case channels.PURCHASE_GET_ALL:
      return wrap(() => queries.purchases.getAll());
    case channels.PURCHASE_CREATE:
      return wrap(() => {
        const vResult = validation.validatePurchaseData(args);
        if (!vResult.valid) throw new Error(vResult.error);
        const data = vResult.data;
        const result = queries.purchases.create(data);
        return { id: result.lastInsertRowid, purchaseNumber: result.purchaseNumber };
      });
    case channels.PURCHASE_GET_BY_ID:
      return wrap(() => {
        validation.assertInteger(args, 'Purchase ID');
        return queries.purchases.getById(args);
      });
    case channels.PURCHASE_UPDATE:
      return wrap(() => {
        const { id, data: rawData } = args;
        validation.assertInteger(id, 'Purchase ID');
        const vResult = validation.validatePurchaseData(rawData);
        if (!vResult.valid) throw new Error(vResult.error);
        queries.purchases.update(id, vResult.data);
        return true;
      });
    case channels.PURCHASE_DELETE:
      return wrap(() => {
        validation.assertInteger(args, 'Purchase ID');
        queries.purchases.delete(args);
        return true;
      });
    case channels.PURCHASE_SEARCH:
      return wrap(() => queries.purchases.search(args || {}));
    case channels.PURCHASE_GET_NEXT_NUMBER:
      return wrap(() => queries.purchases.getNextPurchaseNumber());

    // Reports
    case channels.REPORT_CLIENT_RECOVERY:
      return wrap(() => queries.reports.getClientRecovery(args.customerId, args.dateFrom, args.dateTo, args.allClients));
    case channels.REPORT_ITEM_SALES:
      return wrap(() => queries.reports.getItemSales(args.itemId, args.dateFrom, args.dateTo));
    case channels.REPORT_DAILY_SALES:
      return wrap(() => queries.reports.getDailySales(args.dateFrom, args.dateTo));
    case channels.REPORT_LEDGER:
      return wrap(() => queries.reports.getLedger(args.accountId, args.accountType, args.dateFrom, args.dateTo));
    case channels.REPORT_ITEM_PURCHASES:
      return wrap(() => queries.reports.getItemPurchases(args.itemId, args.dateFrom, args.dateTo));
    case channels.REPORT_STOCK:
      return wrap(() => queries.reports.getStockReport(args.asOfDate));
    case channels.REPORT_CUSTOMER_REGISTER:
      return wrap(() => queries.reports.getCustomerRegister(args.asOfDate));
    case channels.REPORT_CONCESSION:
      return wrap(() => queries.reports.getConcessionReport(args.customerId, args.dateFrom, args.dateTo, args.allClients));
    case channels.REPORT_DAILY_DETAILS:
      return wrap(() => queries.reports.getDailySalesDetails(args.date));
    case channels.REPORT_VENDOR_SALES:
      return wrap(() => queries.reports.getVendorSales(args.supplierId, args.dateFrom, args.dateTo, args.allVendors));
    case channels.REPORT_VENDOR_STOCK_BILL:
      return wrap(() => queries.reports.getVendorStockBill(args.supplierId, args.date));
    case channels.REPORT_NET_SUMMARY:
      return wrap(() => queries.reports.getDailyNetAmountSummary(args.asOfDate));
    case channels.REPORT_STOCK_SALE_HISTORY:
      return wrap(() => queries.reports.getStockSaleHistory(args.dateFrom, args.dateTo));

    // App Info (Static for browser)
    case channels.APP_GET_VERSION:
      return { success: true, data: '1.0.0-dev' };
    case channels.APP_GET_PLATFORM:
      return { success: true, data: 'browser' };

    // Reference Data
    case channels.REFERENCE_GET_CITIES:
      return wrap(() => queries.reference.getCities());
    case channels.REFERENCE_GET_COUNTRIES:
      return wrap(() => queries.reference.getCountries());
    case channels.REFERENCE_GET_CATEGORIES:
      return wrap(() => queries.reference.getCategories());

    default:
      return { success: false, error: `Mock IPC channel "${channel}" not implemented` };
  }
}

function wrap(fn) {
  try {
    const data = fn();
    return { success: true, data };
  } catch (err) {
    console.error('Mock IPC Error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { handleMockIpc };
