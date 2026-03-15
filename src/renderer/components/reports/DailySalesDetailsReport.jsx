import { Stack, Grid, Button, Table, LoadingOverlay, Text, ScrollArea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '../../store';
import { ReportViewer } from '../ReportViewer';

/**
 * Daily Sales Details Report (امروزہ بکری تفصیلات)
 * Shows detailed line-item sales for a specific date
 */
export function DailySalesDetailsReport() {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);

  const isUr = language === 'ur';
  const { t: translate } = useTranslation();
  const t = useMemo(
    () => ({
      date: translate('common.date', 'Date'),
      go: translate('common.go', 'Go'),
      customer: translate('common.customerName', 'Customer Name'),
      vendor: translate('common.vendor', 'Vendor'),
      saleNumber: translate('common.saleNo', 'Sale #'),
      item: translate('common.item', 'Item'),
      weight: translate('common.weight', 'Weight'),
      rate: translate('common.rate', 'Rate'),
      amount: translate('common.amount', 'Amount'),
      total: translate('common.total', 'Total'),
      noRecords: translate('dailySalesDetails.noRecords', 'No sales found for the selected date'),
      reportTitle: translate('dailySalesDetails.title', 'Daily Sales Details'),
    }),
    [translate]
  );

  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    return date.toISOString().split('T')[0];
  };

  const formatAmount = (num) => {
    return Math.round(num || 0).toLocaleString('en-US');
  };

  const formatWeight = (num) => {
    return (num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatRate = (num) => {
    return (num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.api.reports.getDailyDetails({
        date: formatDate(selectedDate),
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
  }, [selectedDate]);

  // ——— Professional Urdu-only print layout ———
  const printContentHTML = useMemo(() => {
    if (!reportData || reportData.transactions.length === 0) return null;

    const fmtAmount = (num) => Math.round(num || 0).toLocaleString('en-US');
    const fmtDecimal = (num) =>
      (num || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const rows = reportData.transactions
      .map(
        (row, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${row.customer_name}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${row.supplier_name || '-'}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${row.item_name}</td>
        <td class="amount-cell" style="text-align: left;">${row.sale_number}</td>
        <td class="amount-cell">${fmtDecimal(row.weight)}</td>
        <td class="amount-cell">Rs. ${fmtDecimal(row.rate)}</td>
        <td class="amount-cell">Rs. ${fmtAmount(row.amount)}</td>
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
            <th colspan="8" class="section-header">${t.reportTitle}</th>
          </tr>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.customer}</th>
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.vendor}</th>
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.item}</th>
            <th style="width: 80px; text-align: left; direction: ltr;">${t.saleNumber}</th>
            <th style="width: 80px; text-align: left; direction: ltr;">${t.weight}</th>
            <th style="width: 100px; text-align: left; direction: ltr;">${t.rate}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.amount}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="5" style="text-align: ${isUr ? 'right' : 'left'};">${t.total}</td>
            <td class="amount-cell">${fmtDecimal(reportData.totals.total_weight)}</td>
            <td class="amount-cell"></td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.totals.total_amount)}</td>
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
            label={t.date}
            value={selectedDate}
            onChange={setSelectedDate}
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
          title="Daily Sales Details"
          titleUrdu="امروزہ بکری تفصیلات"
          singleDate={formatDate(selectedDate)}
          printContentHTML={printContentHTML}
          exportData={reportData.transactions}
          exportColumns={[
            { key: 'sale_number', label: t.saleNumber },
            { key: 'customer_name', label: t.customer },
            { key: 'supplier_name', label: t.vendor },
            { key: 'item_name', label: t.item },
            { key: 'weight', label: t.weight },
            { key: 'rate', label: t.rate },
            { key: 'amount', label: t.amount },
          ]}
        >
          <ScrollArea style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>#</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.saleNumber}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.customer}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.vendor}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.item}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.weight}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.rate}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.amount}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reportData.transactions.map((row, index) => (
                  <Table.Tr key={index}>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>{index + 1}</Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {row.sale_number}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {row.customer_name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {row.supplier_name || '-'}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {row.item_name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatWeight(row.weight)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatRate(row.rate)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatAmount(row.amount)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr className="font-bold bg-gray-100">
                  <Table.Td colSpan={5} style={{ textAlign: isUr ? 'right' : 'left' }}>
                    <strong>{t.total}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatWeight(reportData.totals.total_weight)}</strong>
                  </Table.Td>
                  <Table.Td />
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatAmount(reportData.totals.total_amount)}</strong>
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

export default DailySalesDetailsReport;
