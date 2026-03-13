# FISHPLUS Distributor

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Stack: Electron-Vite-React](https://img.shields.io/badge/Stack-Electron--Vite--React-61dafb.svg)](https://electronjs.org)

**FISHPLUS Distributor** is a comprehensive ERP and management system designed specifically for the seafood wholesale and distribution industry. Tailored for commission agents (*Arthis*) and large-scale fish traders, it simplifies the complex logistics and financial calculations inherent in the trade.

---

## 🌊 Industry Focus: Seafood Distribution
The system is built to handle the unique challenges of the fish market, including:
- **Variable Weights:** Real-time calculation of Gross, Tare, and Net weights (kg).
- **Complex Deductions:** Automated calculations for industry-standard charges like **Labor**, **Ice**, **Fare/Trucking**, and **Munshiana** (Market/Association fees).
- **Credit-Based Trading:** Robust management of vendor advances and customer recovery ledgers.

## ✨ Key Features
- **📦 Inventory Management:** Real-time stock tracking with category-wise item management.
- **💰 Sales & Purchases:** Line-item based transaction entry with support for both cash and credit sales.
- **📑 Automated Vendor Billing:** Generate professional, itemized bills for suppliers with automatic deduction of commissions and expenses.
- **📊 Reporting Suite:** Comprehensive reports including Customer/Vendor Ledgers, Daily Net Amount Summaries, and Stock History.
- **🌍 Bilingual Support:** Full support for **English** and **Urdu**, including a native Right-to-Left (RTL) experience for the Urdu interface.
- **🖨️ Exports:** Export any report or bill to high-quality **PDF** or **Excel** formats.

## 🛠️ Tech Stack
- **Framework:** [Electron 40](https://www.electronjs.org/) (Desktop Application Wrapper)
- **Build Tool:** [Vite 7](https://vitejs.dev/) (Fast ESM-based build system)
- **Frontend:** [React 19](https://react.dev/), [Mantine 8](https://mantine.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
- **Database:** [SQLite](https://www.sqlite.org/) (via `better-sqlite3`)
- **Reporting:** [ExcelJS](https://github.com/exceljs/exceljs), [jsPDF](https://github.com/parallax/jsPDF)
- **Localization:** [i18next](https://www.i18next.com/)

## 🏗️ Architecture
The application follows Electron's best practices for security and performance:
- **Main Process (`src/main/`):** Handles window lifecycle, SQLite database management, and file system operations.
- **Renderer Process (`src/renderer/`):** A modern React application utilizing Mantine for UI components and Tailwind for styling.
- **Preload Script (`src/main/preload.js`):** Securely bridges the Main and Renderer processes via `contextBridge`, exposing a controlled `window.api`.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/haris936hk/FISHPLUS-Distributor.git
   cd FISHPLUS-Distributor
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Rebuild native modules (SQLite):
   ```bash
   npm run rebuild
   ```

### Development
Start the application in development mode with hot-reloading:
```bash
npm start
```

### Production Build
Generate a production-ready installer:
```bash
npm run build
```

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author
**Haris Khan**
- Email: [hariskhan936.hk@gmail.com](mailto:hariskhan936.hk@gmail.com)
- GitHub: [@haris936hk](https://github.com/haris936hk)

---
*Built for the Seafood Trading Industry.*
