import {
  Stack,
  Grid,
  Button,
  Table,
  LoadingOverlay,
  Text,
  ScrollArea,
  Group,
  Paper,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useState, useCallback, useMemo } from 'react';

import useStore from '../../store';
import { ReportViewer } from '../ReportViewer';

/**
 * Daily Sales Report (امروزہ بکری)
 * Shows aggregated daily sales summary by item type
 */
export function DailySalesReport() {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [reportData, setReportData] = useState(null);

  const isUr = language === 'ur';
  const t = useMemo(
    () => ({
      fromDate: isUr ? 'تاریخ (سے)' : 'From Date',
      toDate: isUr ? 'تاریخ (تک)' : 'To Date',
      go: isUr ? 'تلاش' : 'Go',
      reportTitle: isUr ? 'امروزہ بکری' : 'Daily Sales Report',
      item: isUr ? 'آئٹم' : 'Item Name',
      totalWeight: isUr ? 'کل وزن' : 'Total Weight',
      totalAmount: isUr ? 'کل رقم' : 'Total Amount',
      grossAmount: isUr ? 'کل رقم' : 'Gross Amount',
      charges: isUr ? 'اخراجات' : 'Charges',
      netAmount: isUr ? 'خالص رقم' : 'Net Amount',
      cashReceived: isUr ? 'نقد وصولی' : 'Cash Received',
      collection: isUr ? 'کل وصولی' : 'Collection',
      discount: isUr ? 'رعایت' : 'Discount',
      balance: isUr ? 'بقایا' : 'Balance',
      summary: isUr ? 'خلاصہ' : 'Summary',
      noRecords: isUr
        ? 'منتخب کردہ معیار کے لئے کوئی ریکارڈ نہیں ملا'
        : 'No records found for the selected criteria',
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
      const response = await window.api.reports.getDailySales({
        dateFrom: formatDate(dateFrom),
        dateTo: formatDate(dateTo),
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
  }, [dateFrom, dateTo]);

  // ——— Professional Urdu-only print layout ———
  const printContentHTML = useMemo(() => {
    if (!reportData || reportData.byItem.length === 0) return null;

    const fmt = (num) =>
      (num || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const rows = reportData.byItem
      .map(
        (row, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${row.item_name}</td>
        <td class="amount-cell">${fmt(row.total_weight)}</td>
        <td class="amount-cell">Rs. ${fmt(row.total_amount)}</td>
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
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px; direction: ${isUr ? 'rtl' : 'ltr'}; }
        .summary-box { border: 1px solid #ccc; padding: 10px; text-align: center; background-color: #fafafa; border-radius: 4px; }
        .summary-label { font-size: 12px; color: #555; margin-bottom: 5px; }
        .summary-value { font-size: 16px; font-weight: bold; direction: ltr; font-family: 'Segoe UI', Tahoma, sans-serif; }
      </style>

      <table class="print-table">
        <thead>
          <tr>
            <th colspan="4" class="section-header">${t.reportTitle}</th>
          </tr>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.item}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.totalWeight}</th>
            <th style="width: 150px; text-align: left; direction: ltr;">${t.totalAmount}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="summary-grid">
        <div class="summary-box">
          <div class="summary-label">${t.grossAmount}</div>
          <div class="summary-value">Rs. ${fmt(reportData.totals.gross_amount)}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">${t.charges}</div>
          <div class="summary-value">Rs. ${fmt(reportData.totals.total_charges)}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">${t.netAmount}</div>
          <div class="summary-value">Rs. ${fmt(reportData.totals.net_amount)}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">${t.cashReceived}</div>
          <div class="summary-value">Rs. ${fmt(reportData.totals.cash_received)}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">${t.collection}</div>
          <div class="summary-value">Rs. ${fmt(reportData.totals.total_collection)}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">${t.discount}</div>
          <div class="summary-value">Rs. ${fmt(reportData.totals.total_discount)}</div>
        </div>
        <div class="summary-box" style="grid-column: span 2;">
          <div class="summary-label">${t.balance}</div>
          <div class="summary-value" style="color: ${reportData.totals.total_balance > 0 ? 'red' : 'green'};">Rs. ${fmt(reportData.totals.total_balance)}</div>
        </div>
      </div>
    `;
  }, [reportData, t, isUr]);

  return (
    <Stack gap="md" pos="relative">
      <LoadingOverlay visible={loading} />

      {/* Filters */}
      <Grid align="flex-end" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
        <Grid.Col span={4}>
          <DatePickerInput
            label={t.fromDate}
            value={dateFrom}
            onChange={setDateFrom}
            maxDate={dateTo}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <DatePickerInput
            label={t.toDate}
            value={dateTo}
            onChange={setDateTo}
            minDate={dateFrom}
            maxDate={new Date()}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <Button leftSection={<IconSearch size={16} />} onClick={handleGenerate} fullWidth>
            {t.go}
          </Button>
        </Grid.Col>
      </Grid>

      {reportData && (
        <ReportViewer
          title="Daily Sales Report"
          titleUrdu="امروزہ بکری"
          dateRange={{ from: formatDate(dateFrom), to: formatDate(dateTo) }}
          printContentHTML={printContentHTML}
          exportData={reportData.byItem}
          exportColumns={[
            { key: 'item_name', label: t.item },
            { key: 'total_weight', label: t.totalWeight },
            { key: 'total_amount', label: t.totalAmount },
          ]}
        >
          <ScrollArea style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            {/* Sales by Item Type */}
            <Table striped highlightOnHover withTableBorder withColumnBorders mb="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>#</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.item}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>
                    {t.totalWeight}
                  </Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>
                    {t.totalAmount}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reportData.byItem.map((row, index) => (
                  <Table.Tr key={row.item_id}>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>{index + 1}</Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {row.item_name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(row.total_weight)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(row.total_amount)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {/* Grand Totals Summary */}
            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                {t.summary}
              </Text>
              <Group grow>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t.grossAmount}
                  </Text>
                  <Text fw={600} style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}>
                    {formatNumber(reportData.totals.gross_amount)}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t.charges}
                  </Text>
                  <Text fw={600} style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}>
                    {formatNumber(reportData.totals.total_charges)}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t.netAmount}
                  </Text>
                  <Text fw={600} style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}>
                    {formatNumber(reportData.totals.net_amount)}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t.cashReceived}
                  </Text>
                  <Text fw={600} style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}>
                    {formatNumber(reportData.totals.cash_received)}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t.collection}
                  </Text>
                  <Text fw={600} style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}>
                    {formatNumber(reportData.totals.total_collection)}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t.discount}
                  </Text>
                  <Text fw={600} style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}>
                    {formatNumber(reportData.totals.total_discount)}
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t.balance}
                  </Text>
                  <Text
                    fw={600}
                    c={reportData.totals.total_balance > 0 ? 'red' : 'green'}
                    style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}
                  >
                    {formatNumber(reportData.totals.total_balance)}
                  </Text>
                </Stack>
              </Group>
            </Paper>

            {reportData.byItem.length === 0 && (
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

export default DailySalesReport;
