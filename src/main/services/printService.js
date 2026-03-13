/**
 * Print Service
 * Handles printing and exporting reports to PDF/Excel
 * Implements FR-PRINT-001 through FR-PRINT-012
 */

const fs = require('fs');
const path = require('path');

const { BrowserWindow, dialog, app } = require('electron');
const ExcelJS = require('exceljs');

const jsreportService = require('./jsreportService.js');

/**
 * Print HTML content using a hidden browser window
 * @param {BrowserWindow} mainWindow - Main application window
 * @param {string} htmlContent - HTML content to print
 * @param {Object} options - Print options
 * @returns {Promise<boolean>} Success status
 */
async function printReport(mainWindow, htmlContent, options = {}) {
  const {
    silent = false,
    printBackground = true,
    landscape = false,
    margins = { marginType: 'default' },
  } = options;

  // Create a hidden window for printing
  const printWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  try {
    // Load the HTML content
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    // Wait for content to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Print the content
    const printSuccess = await printWindow.webContents.print({
      silent,
      printBackground,
      landscape,
      ...margins,
    });

    return printSuccess;
  } catch (error) {
    console.error('Print error:', error);
    throw error;
  } finally {
    printWindow.destroy();
  }
}

/**
 * Export content to PDF file
 * @param {BrowserWindow} mainWindow - Main application window
 * @param {string} htmlContent - HTML content to export
 * @param {Object} options - PDF options
 * @returns {Promise<string>} Path to saved PDF file
 */
async function exportToPDF(mainWindow, htmlContent, options = {}) {
  const { filename = 'report.pdf', landscape = false } = options;

  // Show save dialog
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export to PDF',
    defaultPath: path.join(app.getPath('documents'), filename),
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });

  if (canceled || !filePath) {
    return null;
  }

  try {
    // Render PDF using Electron's printToPDF with page numbers
    const pdfBuffer = await jsreportService.renderReport(htmlContent, {
      landscape,
      displayHeaderFooter: true,
    });

    // Save to file
    fs.writeFileSync(filePath, pdfBuffer);

    return filePath;
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
}

/**
 * Export data to Excel (.xlsx) file using exceljs
 * @param {BrowserWindow} mainWindow - Main application window
 * @param {Array<Object>} data - Data to export
 * @param {Object} options - Export options
 * @returns {Promise<string>} Path to saved file
 */
async function exportToExcel(mainWindow, data, options = {}) {
  const {
    filename = 'export.xlsx',
    columns = null,
    sheetName = 'Data',
    title = '',
    titleUrdu = '',
    dateRange = null,
  } = options;

  // Show save dialog
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export to Excel',
    defaultPath: path.join(app.getPath('documents'), filename),
    filters: [
      { name: 'Excel Files', extensions: ['xlsx'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) {
    return null;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FISHPLUS-Distributor';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName, {
      properties: { defaultRowHeight: 20 },
    });

    // Add company header
    let currentRow = 1;

    // Company name
    worksheet.mergeCells(
      `A${currentRow}:${String.fromCharCode(64 + (columns?.length || Object.keys(data[0] || {}).length))}${currentRow}`
    );
    const companyCell = worksheet.getCell(`A${currentRow}`);
    companyCell.value = 'AL-SHEIKH FISH TRADER';
    companyCell.font = { bold: true, size: 16 };
    companyCell.alignment = { horizontal: 'center' };
    currentRow++;

    // Company name in Urdu
    worksheet.mergeCells(
      `A${currentRow}:${String.fromCharCode(64 + (columns?.length || Object.keys(data[0] || {}).length))}${currentRow}`
    );
    const companyUrduCell = worksheet.getCell(`A${currentRow}`);
    companyUrduCell.value = 'الشیخ فش ٹریڈر';
    companyUrduCell.font = { bold: true, size: 14 };
    companyUrduCell.alignment = { horizontal: 'center' };
    currentRow++;

    // Report title
    if (title) {
      worksheet.mergeCells(
        `A${currentRow}:${String.fromCharCode(64 + (columns?.length || Object.keys(data[0] || {}).length))}${currentRow}`
      );
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = title + (titleUrdu ? ` / ${titleUrdu}` : '');
      titleCell.font = { bold: true, size: 12 };
      titleCell.alignment = { horizontal: 'center' };
      currentRow++;
    }

    // Date range
    if (dateRange) {
      worksheet.mergeCells(
        `A${currentRow}:${String.fromCharCode(64 + (columns?.length || Object.keys(data[0] || {}).length))}${currentRow}`
      );
      const dateCell = worksheet.getCell(`A${currentRow}`);
      dateCell.value = `From: ${dateRange.from} To: ${dateRange.to}`;
      dateCell.alignment = { horizontal: 'center' };
      currentRow++;
    }

    currentRow++; // Empty row

    // Determine columns
    const cols =
      columns || (data.length > 0 ? Object.keys(data[0]).map((key) => ({ key, label: key })) : []);

    // Style header row
    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = cols.map((col) => col.label || col.key);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    headerRow.border = {
      bottom: { style: 'thin' },
    };
    currentRow++;

    // Add data rows
    for (const row of data) {
      const dataRow = worksheet.getRow(currentRow);
      cols.forEach((col, index) => {
        dataRow.getCell(index + 1).value = row[col.key] ?? '';
      });
      currentRow++;
    }

    // Auto-fit columns (approximate)
    cols.forEach((col, index) => {
      let maxLength = (col.label || col.key).toString().length || 10;
      data.forEach((row) => {
        const val = row[col.key] ?? '';
        const length = val.toString().length;
        if (length > maxLength) maxLength = length;
      });

      const column = worksheet.getColumn(index + 1);
      // Give extra padding for styling and Urdu text size differences
      column.width = Math.min(Math.max(maxLength * 1.2 + 2, 10), 60);
    });

    // Save workbook
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  } catch (error) {
    console.error('Excel export error:', error);
    throw error;
  }
}

/**
 * Generate CSV content from data array
 * @param {Array<Object>} data - Data array
 * @param {Array<{key: string, label: string}>} columns - Column definitions
 * @returns {string} CSV content
 */
function generateCSV(data, columns = null) {
  if (!data || data.length === 0) {
    return '';
  }

  // If columns not specified, use keys from first row
  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  // Generate header row
  const headers = cols.map((col) => escapeCSVValue(col.label || col.key));
  const rows = [headers.join(',')];

  // Generate data rows
  for (const row of data) {
    const values = cols.map((col) => {
      const value = row[col.key];
      return escapeCSVValue(value);
    });
    rows.push(values.join(','));
  }

  return rows.join('\n');
}

/**
 * Escape value for CSV (handles commas, quotes, newlines)
 * @param {*} value - Value to escape
 * @returns {string} Escaped CSV value
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generate company header HTML for reports
 * @returns {string} Company header HTML
 */
function getCompanyHeaderHTML() {
  return `
    <div style="text-align: left; margin-bottom: 8px; direction: ltr;">
      <p style="margin: 0; font-size: 22px; font-weight: bold; font-style: italic; letter-spacing: 0.5px;">AL - SHEIKH FISH TRADER AND DISTRIBUTER</p>
      <p style="margin: 2px 0; font-size: 12px; font-style: italic; color: #222;">Shop No. W-644 Gunj Mandi Rawalpindi</p>
      <p style="margin: 2px 0 0; font-size: 12px; font-style: italic; color: #222;">+92-3008501724, 051-5534607</p>
    </div>
  `;
}

/**
 * Wrap content with print-ready HTML structure
 * @param {string} bodyContent - Body content
 * @param {Object} options - Options
 * @returns {string} Complete HTML document
 */
function wrapInPrintHTML(bodyContent, options = {}) {
  const { title = 'Report', includeHeader = true, direction = 'rtl' } = options;

  const header = includeHeader ? getCompanyHeaderHTML() : '';

  return `
    <!DOCTYPE html>
    <html dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 15mm 20mm 15mm;
        }
        * { box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 13px;
          line-height: 1.5;
          color: #000;
          direction: ${direction};
          margin: 0;
          padding: 20px 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px 10px;
          text-align: ${direction === 'rtl' ? 'right' : 'left'};
          font-size: 12px;
          vertical-align: middle;
        }
        th {
          background-color: #e8e8e8;
          font-weight: bold;
        }
        .total-row {
          font-weight: bold;
          background-color: #f0f0f0 !important;
        }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .text-center { text-align: center; }

        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      ${header}
      ${bodyContent}
    </body>
    </html>
  `;
}

/**
 * Open a print preview window using Electron's built-in PDF viewer.
 * Guarantees exact parity with "Export to PDF" and hooks into native OS print dialogs perfectly.
 * @param {BrowserWindow} mainWindow - Main application window
 * @param {string} htmlContent - HTML content to preview
 * @param {Object} options - Preview options
 * @returns {Promise<void>}
 */
async function printPreview(mainWindow, htmlContent, options = {}) {
  const { width = 1000, height = 800, title = 'Print Preview', landscape = false } = options;

  try {
    // 1. Render PDF buffer using jsreport (guarantees identical output to export)
    const pdfBuffer = await jsreportService.renderReport(htmlContent, {
      landscape,
      displayHeaderFooter: true,
    });

    // 2. Save to a temporary file
    const tempPath = path.join(app.getPath('temp'), `print_preview_${Date.now()}.pdf`);
    fs.writeFileSync(tempPath, pdfBuffer);

    // 3. Open a new visible BrowserWindow to show the PDF
    const previewWindow = new BrowserWindow({
      parent: mainWindow,
      width,
      height,
      title,
      autoHideMenuBar: true,
      webPreferences: {
        plugins: true, // Enables Chromium's built-in PDF viewer
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    previewWindow.setMenu(null);

    // Clean up temporary file when window is closed
    previewWindow.on('closed', () => {
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (err) {
        console.error('Failed to clean up temp PDF preview file:', err);
      }
    });

    // 4. Load the PDF file directly
    await previewWindow.loadFile(tempPath);
  } catch (error) {
    console.error('Print preview error:', error);
    throw error;
  }
}

module.exports = {
  printReport,
  printPreview,
  exportToPDF,
  exportToExcel,
  generateCSV,
  escapeCSVValue,
  getCompanyHeaderHTML,
  wrapInPrintHTML,
};
