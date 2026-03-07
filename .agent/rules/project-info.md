
> Persistent project memory for AI assistants working on FISHPLUS-Distributor.

## Project Overview

**FISHPLUS-Distributor** is a desktop-optimized (mouse-focused) Electron app for fish trading/distribution. Handles vendors, customers, items, sales, purchases, supplier billing, reports, and PDF/Excel/CSV exports.

**Stack:** Electron 40 · Vite 7 · React 19 · Zustand · Mantine 8 · Tailwind CSS 4 · better-sqlite3 · electron-builder · i18next · ExcelJS · jsPDF

---

## Architecture

Strict **IPC separation** between two processes:

- **Main** (`src/main/`) — Node.js **CommonJS** (`require`/`module.exports`). Handles window lifecycle, SQLite, file system, printing. Heavy modules deferred inside `app.whenReady()`.
- **Renderer** (`src/renderer/`) — **ESM** (`import`/`export`), bundled by Vite. React UI with Mantine + Tailwind. No direct Node.js access.
- **Preload** (`src/main/preload.js`) — Bridge via `contextBridge`, exposes `window.api.*`.

---

## Commands

| Task | Command |
|---|---|
| Dev server | `npm start` |
| Build renderer | `npm run build:renderer` |
| Build installer | `npm run build:electron` |
| Full build | `npm run build` |
| Lint / fix | `npm run lint` / `npm run lint:fix` |
| Format / check | `npm run format` / `npm run format:check` |
| Rebuild natives | `npm run rebuild` |

`npm start` runs Vite on port 5173, waits for it, then launches Electron in dev mode.

---

## Code Style

**Prettier:** semicolons, single quotes, 2-space tabs, ES5 trailing commas, 100 char width.

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `SaleForm.jsx` |
| Hooks | `use` prefix | `useResizableColumns.js` |
| Constants | SCREAMING_SNAKE | `SETTINGS_GET_ALL` |
| IPC Channels | colon-separated | `'sale:create'` |
| Main files | CommonJS | `require()` / `module.exports` |
| Renderer files | ESM | `import` / `export` |

---

## IPC API (`window.api.*`)

| Namespace | Key Methods |
|---|---|
| `settings` | `getAll()`, `save(key, value)` |
| `dashboard` | `getSupplierAdvances()`, `getItemsStock()`, `getSummary()` |
| `suppliers` | `getAll()`, `getById()`, `create()`, `update()`, `delete()`, `search()`, `checkNic()` |
| `customers` | Same as suppliers |
| `supplierBills` | `getAll()`, `getById()`, `create()`, `update()`, `delete()`, `generatePreview()`, `getNextNumber()` |
| `items` | `getAll()`, `getById()`, `create()`, `update()`, `delete()`, `search()`, `checkName()` |
| `sales` | `getAll()`, `getById()`, `create()`, `update()`, `delete()`, `search()`, `getNextNumber()` |
| `purchases` | Same as sales |
| `reference` | `getCities()`, `getCountries()`, `getCategories()` |
| `app` | `getVersion()`, `getPlatform()`, `getPath(name)` |
| `reports` | `getClientRecovery()`, `getItemSales()`, `getDailySales()`, `getLedger()`, `getItemPurchases()`, `getStock()`, `getCustomerRegister()`, `getConcession()`, `getDailyDetails()`, `getVendorSales()`, `getVendorStockBill()`, `getDailyNetSummary()` |
| `print` | `report()`, `preview()`, `exportPDF()`, `exportExcel()`, `exportCSV()` |
| `backup` | `create()`, `restore()`, `list()` |
| `yearEnd` | `getPreview()`, `process()`, `getHistory()` |
| `on/off` | Event listeners (whitelisted: `db:updated`) |

---

## Terminology

- **Customer** in UI → `customer` in code (never "Client")
- **Vendor** in UI → `supplier` in code/DB

---

## Project Structure

```
FISHPLUS-Distributor/
├── src/
│   ├── main/                           # Main Process (CommonJS)
│   │   ├── index.js                    # Electron entry, window, deferred loading
│   │   ├── preload.js                  # contextBridge → window.api
│   │   ├── database/
│   │   │   ├── index.js                # DB init, query(), execute(), transaction()
│   │   │   ├── queries.js              # All domain queries
│   │   │   ├── migrations.js           # Schema versioning
│   │   │   ├── schema.sql              # Full database schema
│   │   │   ├── migration_v3.sql        # Migration script v3
│   │   │   ├── migration_v4.sql        # Migration script v4
│   │   │   └── ERD.md                  # Entity-Relationship diagram
│   │   ├── ipc/
│   │   │   ├── channels.js             # IPC channel name constants
│   │   │   └── handlers.js             # All ipcMain.handle() registrations
│   │   └── services/
│   │       ├── printService.js         # Print, PDF export, Excel/CSV export
│   │       └── jsreportService.js      # HTML→PDF via Electron printToPDF
│   │
│   └── renderer/                       # Renderer Process (ESM, Vite)
│       ├── index.html                  # HTML template (Vite entry)
│       ├── index.jsx                   # React mount point
│       ├── index.css                   # Global styles (Tailwind imports)
│       ├── vite.config.js              # Vite configuration
│       ├── App.jsx                     # Root component — routing, theme, providers
│       ├── components/
│       │   ├── index.js                # Barrel export
│       │   ├── SaleForm.jsx            # Sale entry form
│       │   ├── SaleSearch.jsx          # Sale search/listing
│       │   ├── PurchaseForm.jsx        # Purchase entry form
│       │   ├── PurchaseSearch.jsx      # Purchase search/listing
│       │   ├── CustomerForm.jsx        # Customer CRUD form
│       │   ├── CustomerSearch.jsx      # Customer search/listing
│       │   ├── SupplierForm.jsx        # Vendor CRUD form
│       │   ├── SupplierSearch.jsx      # Vendor search/listing
│       │   ├── ItemForm.jsx            # Item CRUD form
│       │   ├── ItemSearch.jsx          # Item search/listing
│       │   ├── SupplierBillForm.jsx    # Vendor bill creation
│       │   ├── SupplierBillPreview.jsx # Vendor bill preview
│       │   ├── SupplierAdvancesList.jsx# Vendor advances widget
│       │   ├── ItemStockDisplay.jsx    # Stock levels widget
│       │   ├── ReportViewer.jsx        # Report rendering container
│       │   ├── DashboardButton.jsx     # Dashboard nav button
│       │   ├── FeatureCard.jsx         # Feature card UI
│       │   ├── ErrorBoundary.jsx       # React error boundary
│       │   └── reports/                # PDF-exportable report components
│       │       ├── index.js
│       │       ├── ClientRecoveryReport.jsx
│       │       ├── ConcessionReport.jsx
│       │       ├── CustomerRegisterReport.jsx
│       │       ├── DailyNetAmountSummaryReport.jsx
│       │       ├── DailySalesDetailsReport.jsx
│       │       ├── DailySalesReport.jsx
│       │       ├── ItemPurchaseReport.jsx
│       │       ├── ItemSaleReport.jsx
│       │       ├── LedgerReport.jsx
│       │       ├── StockReport.jsx
│       │       ├── VendorSalesReport.jsx
│       │       └── VendorStockBillReport.jsx
│       ├── pages/
│       │   ├── index.js                # Barrel export
│       │   ├── Dashboard.jsx           # Main dashboard (landing page)
│       │   ├── Sales.jsx
│       │   ├── Purchases.jsx
│       │   ├── Customers.jsx
│       │   ├── Suppliers.jsx
│       │   ├── Items.jsx
│       │   ├── SupplierBills.jsx
│       │   ├── Reports.jsx
│       │   └── Settings.jsx
│       ├── hooks/
│       │   ├── useDatabase.js          # ⚠️ DEPRECATED — use window.api.*
│       │   └── useResizableColumns.js  # Table column resize hook
│       ├── utils/
│       │   ├── index.js                # Barrel export
│       │   ├── formatters.js           # Number, date, currency formatters
│       │   └── validators.js           # Input validation functions
│       ├── store/
│       │   └── index.js                # Zustand store with devtools
│       └── i18n/
│           ├── index.js                # i18next initialization
│           ├── en.json                 # English translations
│           └── ur.json                 # Urdu translations
│
├── electron-builder.yml                # Packaging config (NSIS installer)
├── eslint.config.js                    # ESLint flat config
├── postcss.config.js                   # PostCSS (@tailwindcss/postcss + autoprefixer)
├── tailwind.config.js                  # Tailwind CSS 4 config
├── .prettierrc                         # Prettier config
└── package.json                        # Dependencies & scripts
```

---

## Do's & Don'ts

**Do:**
- Use `window.api.*` for all IPC communication
- Use Mantine components + Tailwind for styling
- Use `PropTypes` for props validation
- Use `t()` (i18next) for all UI text — English and Urdu
- Use `require()`/`module.exports` in main process
- Use `import`/`export` in renderer
- Use barrel exports (`index.js`) in directories
- Keep heavy `require()` calls inside `app.whenReady()`

**Don't:**
- Use raw SQL in renderer — use `window.api.*`
- Disable `contextIsolation` or enable `nodeIntegration`
- Import Electron in renderer
- Use ESM in main process files
- Use the deprecated `useDatabase` hook
- Use inline styles — prefer Tailwind or Mantine props
- Call `ipcRenderer` directly — go through `window.api`
- Hardcode strings — use translation keys

---

## Key Gotchas

1. **Main = CJS, Renderer = ESM.** Main process runs as raw Node.js (not bundled). Renderer is bundled by Vite.
2. **`useDatabase` is deprecated.** Always use `window.api.*`.
3. **DevTools** auto-open only when `!app.isPackaged`.
4. **DB lifecycle:** Initialized inside `app.whenReady()`, closed on `before-quit`.
5. **Schema ordering:** Tables in `schema.sql` must be ordered by dependency (referenced tables first).
6. **PDF margins** must be in **inches** when using `printToPDF` with custom margins.
7. **Vite `base: './'`** is critical — Electron needs relative paths.
8. **After installing deps**, run `npm run rebuild` for `better-sqlite3`.
9. **Window uses** `show: false` + `ready-to-show` pattern + `v8CacheOptions: 'code'`.
10. **Vendor vs Supplier:** UI says "Vendor", code/DB says `supplier`.
