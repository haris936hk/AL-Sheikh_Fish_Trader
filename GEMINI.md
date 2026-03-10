> Memory for FISHPLUS-Distributor assistants.

## Overview
**FISHPLUS-Distributor:** Electron app for fish distribution (Vendor/Customer/Item management, Sales, Billing, PDF/Excel reports).
**Stack:** Electron 40, Vite 7, React 19, Mantine 8, Tailwind 4, SQLite, i18next, ExcelJS, jsPDF.

## Architecture
**IPC Separation:**
- **Main** (`src/main/`): CJS. Window lifecycle, SQLite, FS. Heavy modules deferred `app.whenReady()`.
- **Renderer** (`src/renderer/`): ESM (Vite). React UI. No Node.js access.
- **Preload** (`src/main/preload.js`): `contextBridge` exposing `window.api`.

## Commands
`npm start` (Dev) · `npm run build` (Full) · `npm run build:electron` (Installer) · `npm run lint` / `format` · `npm run rebuild` (SQLite).

## Code Style
- **Prettier:** ES5 commas, single quotes, 2-space tabs, 100 width.
- **Conventions:** PascalCase Components, `use` Hooks, SCREAMING_SNAKE Constants, Colon:Separated:IPC.
- **Processes:** Main=CJS (`require`), Renderer=ESM (`import`).

## IPC API (`window.api`)
- **Common:** `settings`, `dashboard`, `reference`, `app`, `print`, `backup`, `yearEnd`.
- **CRUD:** `suppliers`, `customers`, `supplierBills`, `items`, `sales`, `purchases`.
- **Key Methods:** Search, get(All/Id/NextNum), save/create/update/delete, generatePreview, report, exportPDF/Excel.

## Terminology
UI "Vendor" = code `supplier`. UI/Code "Customer" (never "Client").


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
- **Do:** Use `window.api` for IPC · use Mantine + Tailwind · use `t()` for all UI text · use `PropTypes` · use CJS in Main, ESM in Renderer · use barrel exports · defer heavy `require`.
- **Don't:** Use raw SQL in renderer · disable `contextIsolation` · import Electron in renderer · use deprecated `useDatabase` · use inline styles · hardcode strings.

## Key Gotchas
- **Processes:** Main (CJS/Raw Node) vs Renderer (ESM/Vite).
- **Database:** Initialized in `app.whenReady`. `useDatabase` is deprecated. Tables in `schema.sql` by dependency order.
- **Environment:** `base: './'` in Vite is required. `npm run rebuild` for `better-sqlite3`.
- **Printing:** PDF margins in inches for `printToPDF`.
- **UI/DB:** UI "Vendor" = code `supplier`.
