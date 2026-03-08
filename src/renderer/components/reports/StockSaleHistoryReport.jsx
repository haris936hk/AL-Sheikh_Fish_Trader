import { Stack, Grid, Button, Table, LoadingOverlay, Text, ScrollArea, Badge } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useState, useCallback, useMemo } from 'react';

import useStore from '../../store';
import { ReportViewer } from '../ReportViewer';

/**
 * Stock Sale History Report (سٹاک بکری تاریخ)
 * Shows all sales made from stock (is_stock = 1) within a date range.
 * Columns: #, Date, Sale #, Customer, Item, Rate, Weight, Amount
 */
export function StockSaleHistoryReport() {
  const { language } = useStore();
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [reportData, setReportData] = useState(null);

  const isUr = language === 'ur';
  const t = useMemo(
    () => ({
      dateFrom: isUr ? 'تاریخ سے' : 'Date From',
      dateTo: isUr ? 'تاریخ تک' : 'Date To',
      go: isUr ? 'تلاش' : 'Go',
      reportTitle: isUr ? 'سٹاک بکری تاریخ' : 'Stock Sale History',
      date: isUr ? 'تاریخ' : 'Date',
      saleNo: isUr ? 'بکری نمبر' : 'Sale #',
      customer: isUr ? 'گاہک' : 'Customer',
      item: isUr ? 'قسم' : 'Item',
      supplier: isUr ? 'بیوپاری' : 'Supplier',
      rate: isUr ? 'ریٹ' : 'Rate',
      weight: isUr ? 'وزن' : 'Weight (kg)',
      amount: isUr ? 'رقم' : 'Amount',
      total: isUr ? 'ٹوٹل' : 'Total',
      noRecords: isUr
        ? 'منتخب کردہ تاریخ کے لئے کوئی سٹاک بکری نہیں ملی'
        : 'No stock sales found for the selected date range',
    }),
    [isUr]
  );

  const formatDate = (d) => d.toISOString().split('T')[0];

  const formatNumber = (num) =>
    (num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatWeight = (num) =>
    (num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK');
  };

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.api.reports.getStockSaleHistory({
        dateFrom: formatDate(dateFrom),
        dateTo: formatDate(dateTo),
      });

      if (response.success) {
        setReportData(response.data);
        if (response.data.transactions.length === 0) {
          notifications.show({
            title: isUr ? 'کوئی نتیجہ نہیں' : 'No Results',
            message: t.noRecords,
            color: 'blue',
          });
        }
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
  }, [dateFrom, dateTo, t, isUr]);

  // ——— Professional print layout ———
  const printContentHTML = useMemo(() => {
    if (!reportData || reportData.transactions.length === 0) return null;

    const fmt = (num) =>
      (num || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const fmtWeight = (num) =>
      (num || 0).toLocaleString('en-US', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });

    const rows = reportData.transactions
      .map(
        (item, index) => `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td style="text-align: center;">${new Date(item.sale_date).toLocaleDateString('en-PK')}</td>
                <td style="text-align: center;">${item.sale_number}</td>
                <td style="text-align: ${isUr ? 'right' : 'left'};">${item.customer_name}</td>
                <td style="text-align: ${isUr ? 'right' : 'left'};">${item.item_name}</td>
                <td class="amount-cell">Rs. ${fmt(item.rate)}</td>
                <td class="amount-cell">${fmtWeight(item.weight)}</td>
                <td class="amount-cell">Rs. ${fmt(item.amount)}</td>
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
                .print-table .grand-total-row { background-color: #d0e0f0; font-weight: bold; font-size: 16px; border-top: 2px solid #000; }
            </style>

            <table class="print-table">
                <thead>
                    <tr>
                        <th colspan="8" class="section-header">${t.reportTitle}</th>
                    </tr>
                    <tr>
                        <th style="width: 40px; text-align: center;">#</th>
                        <th style="text-align: center;">${t.date}</th>
                        <th style="text-align: center;">${t.saleNo}</th>
                        <th style="text-align: ${isUr ? 'right' : 'left'};">${t.customer}</th>
                        <th style="text-align: ${isUr ? 'right' : 'left'};">${t.item}</th>
                        <th style="width: 100px; text-align: left; direction: ltr;">${t.rate}</th>
                        <th style="width: 100px; text-align: left; direction: ltr;">${t.weight}</th>
                        <th style="width: 120px; text-align: left; direction: ltr;">${t.amount}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr class="grand-total-row">
                        <td colspan="5" style="text-align: ${isUr ? 'right' : 'left'};">${t.total}</td>
                        <td></td>
                        <td class="amount-cell">${fmtWeight(reportData.totalWeight)}</td>
                        <td class="amount-cell">Rs. ${fmt(reportData.totalAmount)}</td>
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
        <Grid.Col span={4}>
          <DatePickerInput
            label={t.dateFrom}
            value={dateFrom}
            onChange={setDateFrom}
            maxDate={new Date()}
            required
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <DatePickerInput
            label={t.dateTo}
            value={dateTo}
            onChange={setDateTo}
            maxDate={new Date()}
            required
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
          title="Stock Sale History"
          titleUrdu="سٹاک بکری تاریخ"
          dateRange={{ from: formatDate(dateFrom), to: formatDate(dateTo) }}
          printContentHTML={printContentHTML}
          exportData={reportData.transactions}
          exportColumns={[
            { key: 'sale_date', label: t.date },
            { key: 'sale_number', label: t.saleNo },
            { key: 'customer_name', label: t.customer },
            { key: 'item_name', label: t.item },
            { key: 'supplier_name', label: t.supplier },
            { key: 'rate', label: t.rate },
            { key: 'weight', label: t.weight },
            { key: 'amount', label: t.amount },
          ]}
        >
          {reportData.transactions.length > 0 && (
            <Grid mb="sm" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
              <Grid.Col span={4}>
                <Badge size="lg" variant="light" color="blue">
                  {reportData.transactions.length} {isUr ? 'سٹاک بکریاں' : 'stock sales'}
                </Badge>
              </Grid.Col>
              <Grid.Col span={4}>
                <Badge size="lg" variant="light" color="teal">
                  {formatWeight(reportData.totalWeight)} kg
                </Badge>
              </Grid.Col>
              <Grid.Col span={4}>
                <Badge size="lg" variant="light" color="green">
                  Rs. {formatNumber(reportData.totalAmount)}
                </Badge>
              </Grid.Col>
            </Grid>
          )}

          <ScrollArea style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: 'center' }}>#</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>{t.date}</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>{t.saleNo}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.customer}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.item}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.supplier}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.rate}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.weight}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.amount}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reportData.transactions.map((item, index) => (
                  <Table.Tr key={item.id}>
                    <Table.Td style={{ textAlign: 'center' }}>{index + 1}</Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {formatDisplayDate(item.sale_date)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>{item.sale_number}</Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {item.customer_name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {item.item_name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {item.supplier_name || '-'}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(item.rate)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatWeight(item.weight)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(item.amount)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr style={{ fontWeight: 'bold', backgroundColor: '#d0e0f0' }}>
                  <Table.Td colSpan={6} style={{ textAlign: isUr ? 'right' : 'left' }}>
                    <strong>{t.total}</strong>
                  </Table.Td>
                  <Table.Td />
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatWeight(reportData.totalWeight)}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatNumber(reportData.totalAmount)}</strong>
                  </Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>

            {reportData.transactions.length === 0 && (
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

export default StockSaleHistoryReport;
