import { Stack, Grid, Button, Table, LoadingOverlay, Text, ScrollArea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useState, useCallback, useMemo } from 'react';

import useStore from '../../store';
import { ReportViewer } from '../ReportViewer';

/**
 * Stock Report (سٹاک رپورٹ)
 * Shows stock levels for all items as of a specific date
 */
export function StockReport() {
  const { language } = useStore();
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);

  const isUr = language === 'ur';
  const t = useMemo(
    () => ({
      asOfDate: isUr ? 'تاریخ تک' : 'As of Date',
      go: isUr ? 'تلاش' : 'Go',
      reportTitle: isUr ? 'سٹاک رپورٹ' : 'Stock Report',
      item: isUr ? 'آئٹم' : 'Item Name',
      prevStock: isUr ? 'سابقہ سٹاک' : 'Previous Stock',
      todayPurchase: isUr ? 'آج کی خریداری' : 'Today Purchase',
      todaySale: isUr ? 'آج کی بکری' : 'Today Sale',
      remStock: isUr ? 'بقیہ سٹاک' : 'Remaining Stock',
      total: isUr ? 'کل' : 'Total',
      noRecords: isUr ? 'کوئی آئٹم نہیں ملا' : 'No items found',
    }),
    [isUr]
  );

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatNumber = (num) => {
    return (num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.api.reports.getStock({
        asOfDate: formatDate(asOfDate),
      });

      if (response.success) {
        setReportData(response.data);
      } else {
        notifications.show({
          title: 'Error',
          message: response.error || 'Failed to generate report',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to generate report',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  // ——— Professional Urdu-only print layout ———
  const printContentHTML = useMemo(() => {
    if (!reportData || reportData.items.length === 0) return null;

    const fmt = (num) =>
      (num || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const rows = reportData.items
      .map(
        (item, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${item.item_name}</td>
        <td class="amount-cell">${fmt(item.previous_stock)}</td>
        <td class="amount-cell">${fmt(item.today_purchases)}</td>
        <td class="amount-cell">${fmt(item.today_sales)}</td>
        <td class="amount-cell" style="color: ${item.remaining_stock < 0 ? 'red' : 'black'}; font-weight: ${item.remaining_stock < 0 ? 'bold' : 'normal'};">
          ${fmt(item.remaining_stock)}
        </td>
      </tr>
    `
      )
      .join('');

    return `
      <style>
        .print-table { width: 100%; border-collapse: collapse; margin: 14px 0; direction: ${isUr ? 'rtl' : 'ltr'}; }
        .print-table th, .print-table td { border: 1px solid #000; padding: 8px 14px; font-size: 14px; text-align: ${isUr ? 'right' : 'left'}; }
        .print-table th { background-color: #e8e8e8; font-weight: bold; font-size: 13px; }
        .print-table .section-header { background-color: #f5f5f5; font-weight: bold; font-size: 14px; text-align: center; }
        .print-table .amount-cell { text-align: left; direction: ltr; font-family: 'Segoe UI', Tahoma, sans-serif; white-space: nowrap; }
        .print-table .total-row { background-color: #f0f0f0; font-weight: bold; font-size: 15px; }
      </style>

      <table class="print-table">
        <thead>
          <tr>
            <th colspan="6" class="section-header">${t.reportTitle}</th>
          </tr>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.item}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.prevStock}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.todayPurchase}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.todaySale}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.remStock}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="2" style="text-align: ${isUr ? 'right' : 'left'};">${t.total}</td>
            <td class="amount-cell">${fmt(reportData.totals.previous_stock)}</td>
            <td class="amount-cell">${fmt(reportData.totals.today_purchases)}</td>
            <td class="amount-cell">${fmt(reportData.totals.today_sales)}</td>
            <td class="amount-cell">${fmt(reportData.totals.remaining_stock)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }, [reportData, t, isUr]);

  return (
    <Stack gap="md" pos="relative">
      <LoadingOverlay visible={loading} />

      {/* Filters */}
      <Grid align="flex-end" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
        <Grid.Col span={6}>
          <DatePickerInput
            label={t.asOfDate}
            value={asOfDate}
            onChange={setAsOfDate}
            maxDate={new Date()}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Button leftSection={<IconSearch size={16} />} onClick={handleGenerate} fullWidth>
            {t.go}
          </Button>
        </Grid.Col>
      </Grid>

      {reportData && (
        <ReportViewer
          title="Stock Report"
          titleUrdu="سٹاک رپورٹ"
          singleDate={formatDate(asOfDate)}
          printContentHTML={printContentHTML}
          exportData={reportData.items}
          exportColumns={[
            { key: 'item_name', label: t.item },
            { key: 'previous_stock', label: t.prevStock },
            { key: 'today_purchases', label: t.todayPurchase },
            { key: 'today_sales', label: t.todaySale },
            { key: 'remaining_stock', label: t.remStock },
          ]}
        >
          <ScrollArea style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>#</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.item}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.prevStock}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>
                    {t.todayPurchase}
                  </Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.todaySale}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.remStock}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reportData.items.map((item, index) => (
                  <Table.Tr key={item.id}>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>{index + 1}</Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {item.item_name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(item.previous_stock)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(item.today_purchases)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(item.today_sales)}
                    </Table.Td>
                    <Table.Td
                      style={{
                        textAlign: isUr ? 'left' : 'right',
                        direction: 'ltr',
                        color: item.remaining_stock < 0 ? 'red' : 'inherit',
                        fontWeight: item.remaining_stock < 0 ? 'bold' : 'normal',
                      }}
                    >
                      {formatNumber(item.remaining_stock)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr className="font-bold bg-gray-100">
                  <Table.Td colSpan={2} style={{ textAlign: isUr ? 'right' : 'left' }}>
                    <strong>{t.total}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatNumber(reportData.totals.previous_stock)}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatNumber(reportData.totals.today_purchases)}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatNumber(reportData.totals.today_sales)}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatNumber(reportData.totals.remaining_stock)}</strong>
                  </Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>

            {reportData.items.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                {t.noRecords}
              </Text>
            )}
          </ScrollArea>
        </ReportViewer>
      )}
    </Stack>
  );
}

export default StockReport;
