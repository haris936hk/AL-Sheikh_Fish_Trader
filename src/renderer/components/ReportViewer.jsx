import { Paper, Stack, Group, Title, Text, Button, Divider, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPrinter,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconChevronDown,
} from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '../store';
import { formatDate } from '../utils/formatters';

/**
 * ReportViewer - Shared report viewer component with print and export functionality
 * Provides company header, print button, and PDF/CSV export for all reports
 * Implements FR-PRINT-001 through FR-PRINT-012
 */
export function ReportViewer({
  title,
  titleUrdu = '',
  dateRange = null,
  singleDate = null,
  children,
  exportData = null, // Optional: Array of objects for CSV export
  exportColumns = null, // Optional: Column definitions for CSV export
  printContentHTML = null, // Optional: Custom print body HTML (overrides DOM capture)
}) {
  const { t } = useTranslation();
  const printRef = useRef();
  const language = useStore((s) => s.language);
  const settings = useStore((s) => s.settings || {});

  // Determine the display title based on the active language
  const displayTitle = language === 'ur' && titleUrdu ? titleUrdu : title;

  const generatePrintHTML = () => {
    const content = printRef.current;

    // Use localized formatter
    const formatPrintDate = (d) => formatDate(d, 'display', t);

    // Build date section HTML (Language-aware)
    let dateHTML = '';
    if (dateRange) {
      if (language === 'ur') {
        dateHTML = `
          <div class="date-box">
            <span class="date-label">${t('report.date')} :</span>
            <span>${formatPrintDate(dateRange.from)}</span>
            <span class="date-separator">${t('report.from')}</span>
            <span>${formatPrintDate(dateRange.to)}</span>
            <span class="date-separator">${t('report.to')}</span>
          </div>`;
      } else {
        dateHTML = `
          <div class="date-box">
            <span class="date-label">${t('report.date')}:</span>
            <span>${formatPrintDate(dateRange.from)}</span>
            <span class="date-separator">${t('report.to')}</span>
            <span>${formatPrintDate(dateRange.to)}</span>
          </div>`;
      }
    } else if (singleDate) {
      dateHTML = `
        <div class="date-box">
          <span class="date-label">${t('report.date')} :</span>
          <span>${formatPrintDate(singleDate)}</span>
        </div>`;
    }

    return `
      <!DOCTYPE html>
      <html dir="${language === 'ur' ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="UTF-8">
          <title>${displayTitle}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm 15mm 20mm 15mm;
            }
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px 30px;
              color: #000;
              direction: ${language === 'ur' ? 'rtl' : 'ltr'};
              font-size: 13px;
              line-height: 1.5;
            }

            /* ——— Company Header (Crystal Reports style) ——— */
            .report-header {
              text-align: left;
              margin-bottom: 8px;
              direction: ltr;
            }
            .company-name { 
              font-size: 22px; 
              font-weight: bold; 
              font-style: italic;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .company-address { 
              font-size: 12px; 
              font-style: italic;
              margin: 2px 0;
              color: #222;
            }
            .company-phone {
              font-size: 12px;
              font-style: italic;
              margin: 2px 0 0;
              color: #222;
            }

            /* ——— Report Title (Urdu, right-aligned) ——— */
            .title-section {
              text-align: right;
              margin: 12px 0 4px;
              direction: rtl;
            }
            .report-title-urdu {
              font-size: 26px;
              font-weight: bold;
              margin: 0;
              line-height: 1.3;
            }
            .report-title-en {
              font-size: 11px;
              color: #555;
              margin: 2px 0 0;
              direction: ltr;
              text-align: right;
            }
            .report-date-small {
              font-size: 11px;
              color: #444;
              text-align: right;
              margin: 2px 0 8px;
              direction: ltr;
            }

            /* ——— Date Box ——— */
            .date-box {
              border: 1px solid #000;
              padding: 6px 16px;
              margin: 10px 0 16px;
              display: inline-block;
              font-size: 13px;
              direction: rtl;
              text-align: center;
              width: 100%;
            }
            .date-label {
              font-weight: bold;
              margin-left: 8px;
            }
            .date-separator {
              margin: 0 10px;
              font-weight: bold;
            }

            /* ——— Tables ——— */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 12px 0;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 6px 10px; 
              text-align: right;
              font-size: 12px;
              vertical-align: middle;
            }
            th { 
              background-color: #e8e8e8; 
              font-weight: bold;
              font-size: 12px;
            }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .rtl { direction: rtl; text-align: right; }

            /* Total rows */
            .total-row, tfoot td, tfoot th { 
              font-weight: bold; 
              background-color: #f0f0f0;
            }

            /* ——— Summary Sections ——— */
            .summary-section {
              margin: 16px 0;
              border: 1px solid #000;
              padding: 12px 16px;
            }
            .summary-title {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 10px;
              text-align: right;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 13px;
              direction: rtl;
            }
            .summary-row.subtotal {
              border-top: 1px solid #000;
              padding-top: 6px;
              margin-top: 4px;
            }
            .summary-row.grand-total {
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 6px;
              font-weight: bold;
              font-size: 15px;
            }
            .summary-label { font-weight: bold; }
            .summary-value { direction: ltr; text-align: left; }

            /* ——— Mantine component overrides for print ——— */
            [class*="mantine-Paper"] {
              box-shadow: none !important;
              border: 1px solid #000 !important;
              border-radius: 0 !important;
              padding: 12px 16px !important;
              margin: 10px 0 !important;
            }
            [class*="mantine-Table"] {
              border-collapse: collapse !important;
            }
            [class*="mantine-Table"] th,
            [class*="mantine-Table"] td {
              border: 1px solid #000 !important;
              padding: 6px 10px !important;
            }
            [class*="mantine-Table"] th {
              background-color: #e8e8e8 !important;
            }
            [class*="mantine-SimpleGrid"] {
              display: block !important;
            }
            [class*="mantine-Text"] {
              font-size: inherit !important;
            }

            /* Tailwind-style utility classes used by report components */
            .flex { display: flex !important; }
            .justify-between { justify-content: space-between !important; }
            .items-center { align-items: center !important; }
            .border-t { border-top: 1px solid #000; }
            .pt-2 { padding-top: 8px; }
            .mt-2 { margin-top: 8px; }
            .gap-xs > * + * { margin-top: 4px; }

            /* Hide Mantine visual-only elements */
            svg, [class*="tabler-icon"] { display: none !important; }

            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; }
              thead { display: table-header-group; }
              .report-header { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <!-- Company Header -->
          <div class="report-header">
            <p class="company-name">${(language === 'ur' && settings.company_name_urdu) || settings.company_name || 'FISHPLUS'}</p>
            <p class="company-address">${(language === 'ur' && settings.company_address_urdu) || settings.company_address || ''}</p>
            <p class="company-phone">${settings.company_phone || ''}</p>
          </div>

          <!-- Report Title -->
          <div class="title-section" style="text-align: ${language === 'ur' ? 'right' : 'center'}">
            ${
              language === 'ur'
                ? `<p class="report-title-urdu">${displayTitle}</p>`
                : `<p style="font-size: 24px; font-weight: bold; margin: 0; text-align: center;">${displayTitle}</p>`
            }
          </div>

          <!-- Date -->
          ${dateHTML}

          <!-- Report Content -->
          ${printContentHTML || content.innerHTML}
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      const htmlContent = generatePrintHTML();
      const response = await window.api.print.preview(htmlContent, {
        title: `${displayTitle} - ${t('report.print')}`,
        landscape: false,
      });

      if (!response?.success && response?.error) {
        notifications.show({
          title: t('report.printFailed'),
          message: response.error,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Print preview error:', error);
      notifications.show({
        title: t('report.printFailed'),
        message: t('report.printFailed'),
        color: 'red',
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      const htmlContent = generatePrintHTML();
      const response = await window.api.print.exportPDF(htmlContent, {
        filename: `${displayTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        landscape: false,
      });

      if (response.success) {
        notifications.show({
          title: t('report.exportSuccess'),
          message: `${t('report.exportSuccess')}: ${response.data.filePath}`,
          color: 'green',
        });
      } else {
        if (response.error !== 'Export cancelled') {
          notifications.show({
            title: t('report.exportFailed'),
            message: response.error,
            color: 'red',
          });
        }
      }
    } catch (error) {
      console.error('PDF export error:', error);
      notifications.show({
        title: t('report.exportFailed'),
        message: t('report.exportFailed'),
        color: 'red',
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      // If no export data provided, try to extract from table
      let dataToExport = exportData;
      let columnsToUse = exportColumns;

      if (!dataToExport) {
        // Try to extract data from table in the print ref
        const tables = printRef.current?.querySelectorAll('table');
        if (tables && tables.length > 0) {
          dataToExport = [];
          columnsToUse = [];

          const table = tables[0]; // Use first table
          const headers = table.querySelectorAll('thead th');
          headers.forEach((th, index) => {
            columnsToUse.push({
              key: `col${index}`,
              label: th.textContent.trim(),
            });
          });

          const rows = table.querySelectorAll('tbody tr');
          rows.forEach((row) => {
            const rowData = {};
            row.querySelectorAll('td').forEach((td, index) => {
              rowData[`col${index}`] = td.textContent.trim();
            });
            dataToExport.push(rowData);
          });
        }
      }

      if (!dataToExport || dataToExport.length === 0) {
        notifications.show({
          title: t('report.noData'),
          message: t('report.noData'),
          color: 'yellow',
        });
        return;
      }

      const response = await window.api.print.exportExcel(dataToExport, {
        filename: `${displayTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
        columns: columnsToUse,
        title: displayTitle,
        titleUrdu: titleUrdu,
        dateRange: dateRange,
      });

      if (response.success) {
        notifications.show({
          title: t('report.exportSuccess'),
          message: `${t('report.exportSuccess')}: ${response.data.filePath}`,
          color: 'green',
        });
      } else {
        if (response.error !== 'Export cancelled') {
          notifications.show({
            title: t('report.exportFailed'),
            message: response.error,
            color: 'red',
          });
        }
      }
    } catch (error) {
      console.error('Excel export error:', error);
      notifications.show({
        title: t('report.exportFailed'),
        message: t('report.exportFailed'),
        color: 'red',
      });
    }
  };

  const formatDateDisplay = (date) => {
    if (!date) return '';
    return formatDate(date, 'display', t);
  };

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Screen Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Group gap="xs" justify="center">
              <Title order={4} style={{ direction: language === 'ur' ? 'rtl' : 'ltr' }}>
                {displayTitle}
              </Title>
            </Group>
            {dateRange && (
              <Text size="sm" c="dimmed" ta="center">
                {t('report.from')} {formatDateDisplay(dateRange.from)}{' '}
                {t('report.to')} {formatDateDisplay(dateRange.to)}
              </Text>
            )}
            {singleDate && (
              <Text size="sm" c="dimmed" ta="center">
                {t('report.date')}: {formatDateDisplay(singleDate)}
              </Text>
            )}
          </Stack>
          <Group gap="xs">
            <Button leftSection={<IconPrinter size={16} />} onClick={handlePrint} variant="light">
              {t('report.print')}
            </Button>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="light" rightSection={<IconChevronDown size={14} />}>
                  {t('report.export')}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconFileTypePdf size={16} />} onClick={handleExportPDF}>
                  {t('report.exportPdf')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconFileSpreadsheet size={16} />}
                  onClick={handleExportExcel}
                >
                  {t('report.exportExcel')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <Divider />

        <div style={{ overflow: 'auto' }}>
          <div ref={printRef} style={{ width: '100%' }}>
            {children}
          </div>
        </div>
      </Stack>
    </Paper>
  );
}

ReportViewer.propTypes = {
  title: PropTypes.string.isRequired,
  titleUrdu: PropTypes.string,
  dateRange: PropTypes.shape({
    from: PropTypes.string,
    to: PropTypes.string,
  }),
  singleDate: PropTypes.string,
  children: PropTypes.node,
  exportData: PropTypes.array,
  exportColumns: PropTypes.array,
  printContentHTML: PropTypes.string,
};

export default ReportViewer;
