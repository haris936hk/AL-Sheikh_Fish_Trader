import { Paper, Stack, Group, Text, Divider, Button, Center, Table } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '../store';
import { formatDisplayName, formatCurrency, formatWeight, formatDate } from '../utils/formatters';

/**
 * SupplierBillPreview Component
 * Receipt-style preview for printing supplier bills matching the exact legacy format.
 * Implements FR-SUPBILL-010 through FR-SUPBILL-017.
 *
 * @param {Object} previewData - Preview data from form
 */
function SupplierBillPreview({ previewData }) {
  const printRef = useRef();
  const { t } = useTranslation();
  const isUr = useStore((s) => s.language === 'ur');
  const settings = useStore((s) => s.settings || {});

  // Use standard formatters
  const formatAmount = (amount) => formatCurrency(amount, { showSymbol: false }, t);
  const formatDecimal = (value) => formatWeight(value, { decimals: 2, showUnit: false }, t);
  const formatDisplayDateLocal = (date) => formatDate(date, 'DD-MM-YYYY', t);

  // Print handler - Auto export PDF to Documents & Open without Dialog
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    const printContent = printRef.current;
    if (!printContent) return;

    setIsPrinting(true);

    try {
      const htmlPayload = `
        <!DOCTYPE html>
        <html lang="${isUr ? 'ur' : 'en'}" dir="${isUr ? 'rtl' : 'ltr'}">
        <head>
          <title>${t('supplierBill.printTitle')}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
              padding: 20px 40px;
              max-width: 800px;
              margin: 0 auto;
              direction: rtl;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 10px 0;
            }
            th, td { 
              border: 1px solid #ccc; 
              padding: 6px; 
              text-align: center;
              color: #000;
            }
            th { 
              font-weight: bold;
              font-size: 15px;
            }
            
            .header-english {
              font-family: 'Segoe UI', Tahoma, sans-serif;
              direction: ltr;
              text-align: left;
              margin-bottom: 20px;
            }
            .header-english h2 {
              margin: 0;
              font-size: 20px;
              font-style: italic;
              font-weight: bold;
            }
            .header-english p {
              margin: 2px 0;
              font-size: 12px;
              font-style: italic;
            }
            
            .bill-title {
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            
            .meta-info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              font-size: 18px;
            }
            
            .split-container {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            
            .expenses-block, .totals-block {
              width: 45%;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 10px;
              font-size: 16px;
            }
            
            .summary-label {
              font-weight: bold;
              text-align: right;
            }
            
            .summary-val {
              text-align: right;
              direction: ltr;
            }
            
            .border-top {
              border-top: 1px solid #ccc;
              margin-top: 5px;
              padding-top: 10px;
            }
            
            @media print {
              body { padding: 0; margin-top: 10px; }
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `;

      // Build a clean descriptive filename
      const cleanName = (supplierNameEnglish || supplierName || t('common.supplier')).replace(/[^a-zA-Z0-9-]/g, '_');
      const filename = `SupplierBill_${cleanName}_${formatDisplayDateLocal(dateTo)}.pdf`;

      // Send the payload off to the backend API explicitly avoiding browser print dialog
      const result = await window.api.print.exportPDFSilent(htmlPayload, { filename });

      if (result && result.success) {
        notifications.show({
          title: t('app.saved'),
          message: t('supplierBill.pdfSaved'),
          color: 'teal',
        });
      } else {
        throw new Error(result?.error || 'Failed to save PDF silently');
      }

    } catch (error) {
      console.error('Failed to export silent PDF:', error);
      notifications.show({
        title: t('error.title'),
        message: t('supplierBill.pdfError'),
        color: 'red',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  if (!previewData) {
    return (
      <Paper shadow="sm" p="sm" radius="md" withBorder h="100%" className="flex flex-col">
        <Center className="flex-1">
          <Stack align="center" gap="md">
            <Text size="4rem">📋</Text>
            <Text c="dimmed" size="lg">
              {t('supplierBill.emptyPreview')}
            </Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  const { 
    items, 
    totalWeight, 
    grossAmount, 
    supplierAdvance,
    supplierName,
    supplierNameEnglish,
    dateFrom, 
    dateTo,
    // Realtime charges from Form state override default or empty ones
    vehicleNumber,
    commissionAmount,
    drugsCharges,
    fareCharges,
    laborCharges,
    iceCharges,
    totalCharges,
    concessionAmount,
    cashPaid,
    totalPayable
  } = previewData;

  // Real-time calculation block (using default 0s if undefined)
  const safeSupplierAdvance = supplierAdvance || 0; // سابقہ (Previous Balance)
  const safeCommission = commissionAmount || 0;
  const safeDrugs = drugsCharges || 0;
  const safeFare = fareCharges || 0;
  const safeLabor = laborCharges || 0;
  const safeIce = iceCharges || 0;
  const safeTotalCharges = (totalCharges || 0) + safeCommission; // ٹوٹل خرچہ
  
  // Total payable BEFORE deduction (Gross Amount + Previous Balance)
  // Usually previous balance is added to payable, and payments subtracted.
  const payableIncludingPrevious = safeSupplierAdvance + (totalPayable || 0);

  // Supplier naming fallback
  let displayName = '';
  if (supplierName) {
    displayName = formatDisplayName(supplierName, supplierNameEnglish, true);
  } else if (items && items.length > 0) {
    displayName = formatDisplayName(items[0].supplier_name, items[0].supplier_name_english, true);
  }

  // Extract unique vehicles
  const vehicles = items ? [...new Set(items.map((i) => i.vehicle_number).filter(Boolean))] : [];
  const displayVehicle = vehicleNumber || vehicles.join(', ');

  return (
    <Paper shadow="sm" p="sm" radius="md" withBorder dir={isUr ? 'rtl' : 'ltr'} className="h-full flex flex-col overflow-hidden">
      <div className="flex-none pb-3 mb-3 border-b border-gray-200 dark:border-gray-700">
        {/* Print Button */}
        <Group justify="flex-start">
          <Button 
            variant="filled" 
            color="blue" 
            leftSection={<span>🖨️</span>} 
            loading={isPrinting}
            onClick={handlePrint}
          >
            {t('report.print')}
          </Button>
        </Group>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        {/* Visible UI Preview - Clean Mantine Components */}
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start" style={{ direction: 'ltr' }}>
            <div style={{ textAlign: 'left' }}>
              <Text size="xl" fw={700}>
                {settings.company_name || 'AL-Sheikh Traders and Distributors'}
              </Text>
              <Text size="sm" c="dimmed">
                {isUr ? (settings.company_address_urdu || settings.company_address) : (settings.company_address || 'Shop No. W-644 Gunj Mandi Rawalpindi')}
              </Text>
            </div>
            <div style={{ textAlign: 'right', direction: isUr ? 'rtl' : 'ltr' }}>
              <Text size="xl" fw={700} className="urdu">{t('supplierBill.title')}</Text>
              <Text fw={500}>{t('common.name')}: <span style={{ direction: 'ltr', display: 'inline-block' }}>{displayName}</span></Text>
            </div>
          </Group>
          
          <Divider />

          <Group justify="space-between">
            <Group gap="xs">
               <Text>{t('supplierBill.fromDate')}:</Text>
               <Text fw={500} style={{ direction: 'ltr' }}>{formatDisplayDateLocal(dateFrom)}</Text>
               <Text px="sm">–</Text>
               <Text>{t('supplierBill.toDate')}:</Text>
               <Text fw={500} style={{ direction: 'ltr' }}>{formatDisplayDateLocal(dateTo)}</Text>
            </Group>
            <Group gap="xs">
               <Text>{t('supplierBill.vehicle')}:</Text>
               <Text fw={500} style={{ direction: 'ltr' }}>{displayVehicle || '-'}</Text>
            </Group>
          </Group>

          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.number')}</Table.Th>
                <Table.Th>{t('sale.item')}</Table.Th>
                <Table.Th>{t('purchase.rate')}</Table.Th>
                <Table.Th>{t('purchase.weight')}</Table.Th>
                <Table.Th>{t('common.amount')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>{index + 1}</Table.Td>
                    <Table.Td>{formatDisplayName(item.item_name, item.item_name_english, isUr)}</Table.Td>
                    <Table.Td>{(item.rate_per_maund || (item.rate * 40))?.toLocaleString('en-US')}</Table.Td>
                    <Table.Td>{formatDecimal(item.weight)}</Table.Td>
                    <Table.Td>{formatAmount(item.amount)}</Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5} align="center">{t('common.noDataFound')}</Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Group grow align="flex-start" mt="md">
            <Paper withBorder p="sm" bg={isUr ? 'gray.1' : 'gray.0'}>
              <Text fw={600} mb="xs" size="lg">{t('purchase.summary')}</Text>
              <Group justify="space-between"><Text size="sm">{t('supplierBill.totalWeight')}</Text><Text fw={500} style={{ direction: 'ltr' }}>{formatDecimal(totalWeight)}</Text></Group>
              <Group justify="space-between"><Text size="sm">{t('supplierBill.grossAmount')}</Text><Text fw={500} style={{ direction: 'ltr' }}>{formatAmount(grossAmount)}</Text></Group>
              <Group justify="space-between"><Text size="sm">{t('purchase.previous')}</Text><Text fw={500} style={{ direction: 'ltr' }}>{formatAmount(safeSupplierAdvance)}</Text></Group>
              <Group justify="space-between"><Text size="sm" c="blue">{t('supplierBill.netPayable')}</Text><Text fw={700} c="blue" style={{ direction: 'ltr' }}>{formatAmount(payableIncludingPrevious)}</Text></Group>
              <Group justify="space-between"><Text size="sm">{t('supplierBill.concession')}</Text><Text fw={500} style={{ direction: 'ltr' }}>{formatAmount(concessionAmount)}</Text></Group>
              <Divider my="xs" />
              <Group justify="space-between"><Text size="sm" c="green">{t('supplierBill.cashPaid')}</Text><Text fw={700} c="green" style={{ direction: 'ltr' }}>{formatAmount(cashPaid)}</Text></Group>
            </Paper>
            
            <Paper withBorder p="sm" bg={isUr ? 'gray.1' : 'gray.0'}>
              <Text fw={600} mb="xs" size="lg">{t('sale.charges')}</Text>
              <Group justify="space-between"><Text size="sm">{t('supplierBill.commission')}</Text><Text fw={500} style={{ direction: 'ltr' }}>{formatAmount(safeCommission)}</Text></Group>
              <Group justify="space-between"><Text size="sm">{t('supplierBill.labor')}</Text><Text fw={500} style={{ direction: 'ltr' }}>{formatAmount(safeLabor)}</Text></Group>
              <Group justify="space-between"><Text size="sm">{t('supplierBill.fare')}</Text><Text fw={500} style={{ direction: 'ltr' }}>{formatAmount(safeFare)}</Text></Group>
              <Group justify="space-between"><Text size="sm">{t('supplierBill.ice')}</Text><Text fw={500} style={{ direction: 'ltr' }}>{formatAmount(safeIce)}</Text></Group>
              <Group justify="space-between"><Text size="sm">{t('supplierBill.drugsChemicals')}</Text><Text fw={500} style={{ direction: 'ltr' }}>{formatAmount(safeDrugs)}</Text></Group>
              <Divider my="xs" />
              <Group justify="space-between"><Text size="sm" fw={600}>{t('supplierBill.totalCharges')}</Text><Text fw={700} style={{ direction: 'ltr' }}>{formatAmount(safeTotalCharges)}</Text></Group>
            </Paper>
          </Group>
        </Stack>

        {/* Hidden Printable Content - Exact Raw Format */}
        <div style={{ display: 'none' }}>
          <div ref={printRef} className="printable-bill" style={{ color: '#000' }}>

          <div className="header-english">
            <h2>{settings.company_name || 'AL-Sheikh Traders and Distributors'}</h2>
            <p>{isUr ? (settings.company_address_urdu || settings.company_address) : (settings.company_address || 'Shop No. W-644 Gunj Mandi Rawalpindi')}</p>
            <p>{settings.company_phone || '+92-3008501724, 051-5534607'}</p>
          </div>
          
          {/* Bill Title & Supplier Info */}
          <div dir={isUr ? 'rtl' : 'ltr'}>
            <div className={`bill-title ${isUr ? 'urdu' : ''}`}>{t('supplierBill.title')}</div>
            
            <div className="meta-info-row">
              <div style={{ flex: 1, textAlign: isUr ? 'right' : 'left' }}>
                 <strong>{t('common.name')}:</strong> <span style={{ direction: 'ltr', display: 'inline-block' }}>{displayName}</span>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                 {displayVehicle ? <span><strong>{t('supplierBill.vehicle')}</strong> <span style={{ direction: 'ltr', display: 'inline-block' }}>{displayVehicle}</span></span> : ''}
              </div>
              <div style={{ flex: 1 }} />
            </div>

            <div className="meta-info-row">
              <div style={{ flex: 1, textAlign: isUr ? 'right' : 'left' }}>
                  <strong>{t('supplierBill.fromDate')}:</strong> <span style={{ direction: 'ltr', display: 'inline-block' }}>{formatDisplayDateLocal(dateFrom)}</span>
                  <span style={{ margin: '0 10px' }}>–</span>
                  <strong>{t('supplierBill.toDate')}:</strong> <span style={{ direction: 'ltr', display: 'inline-block' }}>{formatDisplayDateLocal(dateTo)}</span>
               </div>
            </div>
          </div>

          <Divider mb="xs" />

          {/* Main 5-Column Items Table */}
          <table dir={isUr ? 'rtl' : 'ltr'}>
            <thead>
              <tr>
                <th>{t('common.number')}</th>
                <th>{t('sale.item')}</th>
                <th>{t('purchase.rate')}</th>
                <th>{t('purchase.weight')}</th>
                <th>{t('common.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td className={isUr ? 'urdu' : ''}>{formatDisplayName(item.item_name, item.item_name_english, isUr)}</td>
                    <td style={{ direction: 'ltr' }}>{(item.rate_per_maund || (item.rate * 40))?.toLocaleString('en-US')}</td>
                    <td style={{ direction: 'ltr' }}>{formatDecimal(item.weight)}</td>
                    <td style={{ direction: 'ltr' }}>{formatAmount(item.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan="5" style={{ padding: '20px' }}>{t('common.noDataFound')}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Footer - Two Column Split for Totals and Expenses */}
          <div className="split-container" dir={isUr ? 'rtl' : 'ltr'}>
            {/* Right Side - Expenses Table */}
            <div className="expenses-block">
               <div className="summary-row">
                  <span className="summary-label">{t('supplierBill.drugsChemicals')}</span>
                  <span className="summary-val">{formatDecimal(safeDrugs)}</span>
               </div>
               <div className="summary-row">
                  <span className="summary-label">{t('supplierBill.fare')}</span>
                  <span className="summary-val">{formatDecimal(safeFare)}</span>
               </div>
               <div className="summary-row">
                  <span className="summary-label">{t('supplierBill.labor')}</span>
                  <span className="summary-val">{formatDecimal(safeLabor)}</span>
               </div>
               <div className="summary-row">
                  <span className="summary-label">{t('supplierBill.commission')}</span>
                  <span className="summary-val">{formatDecimal(safeCommission)}</span>
               </div>
               <div className="summary-row">
                  <span className="summary-label">{t('supplierBill.ice')}</span>
                  <span className="summary-val">{formatDecimal(safeIce)}</span>
               </div>
               <div className="summary-row border-top">
                  <span className="summary-label">{t('supplierBill.totalCharges')}</span>
                  <span className="summary-val">{formatDecimal(safeTotalCharges)}</span>
               </div>
            </div>

            {/* Left Side - Totals Table */}
            <div className="totals-block">
               <div className="summary-row">
                  <span className="summary-label">{t('supplierBill.totalWeight')}</span>
                  <span className="summary-val">{formatDecimal(totalWeight)}</span>
               </div>
               <div className="summary-row">
                  <span className="summary-label">{t('supplierBill.grossAmount')}</span>
                  <span className="summary-val">{formatDecimal(grossAmount)}</span>
               </div>
               <div className="summary-row">
                  <span className="summary-label">{t('purchase.previous')}</span>
                  <span className="summary-val">{formatDecimal(safeSupplierAdvance)}</span>
               </div>
               <div className="summary-row">
                  <span className="summary-label">{t('supplierBill.netPayable')}</span>
                  <span className="summary-val">{formatDecimal(payableIncludingPrevious)}</span>
               </div>
               <div className="summary-row">
                  <span className="summary-label">{t('supplierBill.concession')}</span>
                  <span className="summary-val">{formatDecimal(concessionAmount || 0)}</span>
               </div>
               <div className="summary-row border-top">
                  <span className="summary-label">{t('supplierBill.cashPaid')}</span>
                  <span className="summary-val">{formatDecimal(cashPaid || 0)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Paper>
  );
}

SupplierBillPreview.propTypes = {
  previewData: PropTypes.shape({
    items: PropTypes.array,
    totalWeight: PropTypes.number,
    grossAmount: PropTypes.number,
    supplierId: PropTypes.number,
    supplierAdvance: PropTypes.number,
    supplierName: PropTypes.string,
    supplierNameEnglish: PropTypes.string,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    vehicleNumber: PropTypes.string,
    commissionAmount: PropTypes.number,
    drugsCharges: PropTypes.number,
    fareCharges: PropTypes.number,
    laborCharges: PropTypes.number,
    iceCharges: PropTypes.number,
    totalCharges: PropTypes.number,
    concessionAmount: PropTypes.number,
    cashPaid: PropTypes.number,
    totalPayable: PropTypes.number,
    balanceAmount: PropTypes.number,
  }),
};

export default SupplierBillPreview;

