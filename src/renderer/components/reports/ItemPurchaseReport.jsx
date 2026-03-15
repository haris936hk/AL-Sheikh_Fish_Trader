import {
  Stack,
  Grid,
  Select,
  Button,
  Table,
  LoadingOverlay,
  Text,
  ScrollArea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '../../store';
import { formatDisplayName } from '../../utils/formatters';
import { ReportViewer } from '../ReportViewer';

/**
 * Item Purchase Report (خریداری)
 * Shows purchases for a specific item within date range
 */
export function ItemPurchaseReport() {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [reportData, setReportData] = useState(null);

  const isUr = language === 'ur';
  const { t: translate } = useTranslation();
  const t = useMemo(
    () => ({
      fromDate: translate('common.dateFrom', 'From Date'),
      toDate: translate('common.dateTo', 'To Date'),
      go: translate('common.go', 'Go'),
      item: translate('common.item', 'Item'),
      reportTitle: translate('itemPurchase.title', 'Item Purchase Report'),
      vendor: translate('common.vendor', 'Vendor'),
      date: translate('common.date', 'Date'),
      purchaseNumber: translate('common.purchaseNo', 'Purchase #'),
      weight: translate('common.weight', 'Weight'),
      rate: translate('common.rate', 'Rate'),
      amount: translate('common.amount', 'Amount'),
      total: translate('common.total', 'Total'),
      avg: translate('common.avg', 'Avg'),
      selectItemMsg: translate('error.selectItem', 'Please select an item'),
      noRecords: translate('common.noRecords', 'No records found for the selected criteria'),
    }),
    [translate]
  );

  // Fetch items for dropdown
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await window.api.items.getAll();
        if (response.success) {
          setItems(
            response.data.map((i) => ({
              value: String(i.id),
              label: formatDisplayName(i.name, i.name_english, isUr),
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };
    fetchItems();
  }, [isUr]);

  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    return date.toISOString().split('T')[0];
  };

  const formatAmount = (num) => Math.round(num || 0).toLocaleString('en-US');

  const formatWeight = (num) =>
    (num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });

  const formatRate = (num) =>
    (num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleGenerate = useCallback(async () => {
    if (!selectedItem) {
      notifications.show({
        title: 'Validation Error',
        message: t.selectItemMsg,
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await window.api.reports.getItemPurchases({
        itemId: parseInt(selectedItem),
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
  }, [selectedItem, dateFrom, dateTo, t]);

  // ——— Professional Urdu-only print layout ———
  const printContentHTML = useMemo(() => {
    if (!reportData || reportData.transactions.length === 0) return null;

    const fmtAmount = (num) => Math.round(num || 0).toLocaleString('en-US');

    const fmtWeight = (num) =>
      (num || 0).toLocaleString('en-US', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });

    const fmtRate = (num) =>
      (num || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const rows = reportData.transactions
      .map(
        (row, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${row.supplier_name}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${row.item_name}</td>
        <td class="amount-cell" style="text-align: left;">${row.purchase_number}</td>
        <td class="amount-cell" style="text-align: left;">${new Date(row.purchase_date).toLocaleDateString()}</td>
        <td class="amount-cell">${fmtWeight(row.weight)}</td>
        <td class="amount-cell">Rs. ${fmtRate(row.rate)}</td>
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
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.vendor}</th>
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.item}</th>
            <th style="width: 80px; text-align: left; direction: ltr;">${t.purchaseNumber}</th>
            <th style="width: 100px; text-align: left; direction: ltr;">${t.date}</th>
            <th style="width: 80px; text-align: left; direction: ltr;">${t.weight}</th>
            <th style="width: 100px; text-align: left; direction: ltr;">${t.rate}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.amount}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="5" style="text-align: ${isUr ? 'right' : 'left'};">${t.total}</td>
            <td class="amount-cell">${fmtWeight(reportData.summary.total_weight)}</td>
            <td class="amount-cell" style="font-size: 12px;">${t.avg} Rs. ${fmtRate(reportData.summary.avg_rate)}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.summary.total_amount)}</td>
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
        <Grid.Col span={3}>
          <DatePickerInput
            label={t.fromDate}
            value={dateFrom}
            onChange={setDateFrom}
            maxDate={dateTo}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <DatePickerInput
            label={t.toDate}
            value={dateTo}
            onChange={setDateTo}
            minDate={dateFrom}
            maxDate={new Date()}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <Select
            label={t.item}
            placeholder=""
            data={items}
            value={selectedItem}
            onChange={setSelectedItem}
            searchable
            clearable
            required
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <Button leftSection={<IconSearch size={16} />} onClick={handleGenerate} fullWidth>
            {t.go}
          </Button>
        </Grid.Col>
      </Grid>

      {reportData && (
        <ReportViewer
          title="Item Purchase Report"
          titleUrdu="خریداری"
          dateRange={{ from: formatDate(dateFrom), to: formatDate(dateTo) }}
          printContentHTML={printContentHTML}
          exportData={reportData.transactions.map((row) => ({
            ...row,
            purchase_date_formatted: new Date(row.purchase_date).toLocaleDateString(),
          }))}
          exportColumns={[
            { key: 'purchase_date_formatted', label: t.date },
            { key: 'purchase_number', label: t.purchaseNumber },
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
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.date}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>
                    {t.purchaseNumber}
                  </Table.Th>
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
                      {new Date(row.purchase_date).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {row.purchase_number}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {row.supplier_name}
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
                    <strong>{formatWeight(reportData.summary.total_weight)}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>
                      {t.avg}: {formatRate(reportData.summary.avg_rate)}
                    </strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatAmount(reportData.summary.total_amount)}</strong>
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

export default ItemPurchaseReport;
