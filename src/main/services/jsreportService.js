/* global setTimeout, Buffer */
/**
 * jsreport Service (Electron printToPDF)
 * Renders HTML to PDF using Electron's built-in webContents.printToPDF
 * Supports page numbers, headers/footers — no external dependencies needed
 */

const { BrowserWindow } = require('electron');

/**
 * Render HTML content to a PDF buffer
 * @param {string} htmlContent - Full HTML document string
 * @param {Object} options - PDF rendering options
 * @param {boolean} options.landscape - Landscape orientation (default: false)
 * @param {boolean} options.displayHeaderFooter - Show header/footer (default: true)
 * @param {string} options.headerTemplate - Custom header HTML template
 * @param {string} options.footerTemplate - Custom footer HTML template
 * @returns {Promise<Buffer>} PDF data as buffer
 */
async function renderReport(htmlContent, options = {}) {
  const {
    landscape = false,
    displayHeaderFooter = true,
    footerTemplate = `
      <div style="width: 100%; text-align: center; font-size: 9px; color: #888; padding: 5px 0;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `,
  } = options;

  // Create a hidden BrowserWindow to render the HTML
  const win = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      offscreen: true,
    },
  });

  try {
    // Load HTML content into the window
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    // Wait for content to fully render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Build printToPDF options
    const pdfOptions = {
      landscape,
      printBackground: true,
      pageSize: 'A4',
      margins: {
        marginType: 'custom',
        top: 0.4, // inches (~10mm) - reduced to prevent cutting off body HTML
        bottom: 0.6, // inches (~15mm)
        left: 0.4, // inches (~10mm)
        right: 0.4, // inches (~10mm)
      },
    };

    // Add header/footer if requested
    if (displayHeaderFooter) {
      pdfOptions.displayHeaderFooter = true;
      // Use empty header so it doesn't overlap the HTML body header
      pdfOptions.headerTemplate = '<span></span>';
      pdfOptions.footerTemplate = footerTemplate;
    }

    // Generate PDF
    const pdfBuffer = await win.webContents.printToPDF(pdfOptions);

    return Buffer.from(pdfBuffer);
  } finally {
    win.destroy();
  }
}

/**
 * No-op close (no persistent resources to clean up)
 */
async function close() {
  // Nothing to clean up — each render creates/destroys its own BrowserWindow
}

module.exports = {
  renderReport,
  close,
};
