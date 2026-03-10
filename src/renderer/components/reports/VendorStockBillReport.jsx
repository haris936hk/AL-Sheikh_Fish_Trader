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

import useStore from '../../store';
import { formatDisplayName } from '../../utils/formatters';
import { ReportViewer } from '../ReportViewer';

/**
 * Vendor Stock Bill Report (بیوپاری سٹاک بل)
 * Shows stock-sourced items for a supplier on a given date.
 * Matches original system: date picker + supplier dropdown → table with
 * columns: سیریل نمبر, گاہک, قسم, ریٹ (kg), وزن (kg), رقم
 */
export function VendorStockBillReport() {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [date, setDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);

  const isUr = language === 'ur';
  const t = useMemo(
    () => ({
      vendor: isUr ? 'بیوپاری' : 'Vendor',
      dateLabel: isUr ? 'تاریخ' : 'Date',
      go: isUr ? 'تلاش' : 'Go',
      reportTitle: isUr ? 'بیوپاری سٹاک بل' : 'Vendor Stock Bill',
      customer: isUr ? 'گاہک' : 'Customer',
      item: isUr ? 'قسم' : 'Item',
      rate: isUr ? 'ریٹ' : 'Rate',
      weight: isUr ? 'وزن' : 'Weight',
      amount: isUr ? 'رقم' : 'Amount',
      total: isUr ? 'ٹوٹل' : 'Total',
      selectVendorMsg: isUr ? 'بیوپاری منتخب کریں' : 'Please select a vendor',
      noRecords: isUr
        ? 'منتخب کردہ معیار کے لئے کوئی سٹاک آئٹم نہیں ملا'
        : 'No stock items found for the selected criteria',
    }),
    [isUr]
  );

  // Fetch suppliers for dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await window.api.suppliers.getAll();
        if (response.success) {
          setSuppliers(
            response.data.map((s) => ({
              value: String(s.id),
              label: formatDisplayName(s.name, s.name_english, isUr),
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };
    fetchSuppliers();
  }, [isUr]);

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

  const handleGenerate = useCallback(async () => {
    if (!selectedSupplier) {
      notifications.show({
        title: 'Validation Error',
        message: t.selectVendorMsg,
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await window.api.reports.getVendorStockBill({
        supplierId: parseInt(selectedSupplier),
        date: formatDate(date),
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
  }, [selectedSupplier, date, t]);

  // ——— Professional Urdu-only print layout ———
  const printContentHTML = useMemo(() => {
    if (!reportData || reportData.items.length === 0) return null;

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

    const rows = reportData.items
      .map(
        (item, index) => `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
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
                        <th colspan="6" class="section-header">${t.reportTitle}</th>
                    </tr>
                    <tr>
                        <th style="width: 40px; text-align: center;">#</th>
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
                        <td colspan="3" style="text-align: ${isUr ? 'right' : 'left'};">${t.total}</td>
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
            label={t.dateLabel}
            value={date}
            onChange={setDate}
            maxDate={new Date()}
            required
          />
        </Grid.Col>
        <Grid.Col span={5}>
          <Select
            label={t.vendor}
            placeholder=""
            data={suppliers}
            value={selectedSupplier}
            onChange={setSelectedSupplier}
            searchable
            required
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Button leftSection={<IconSearch size={16} />} onClick={handleGenerate} fullWidth>
            {t.go}
          </Button>
        </Grid.Col>
      </Grid>

      {reportData && (
        <ReportViewer
          title="Vendor Stock Bill"
          titleUrdu="بیوپاری سٹاک بل"
          dateRange={{ from: formatDate(date), to: formatDate(date) }}
          printContentHTML={printContentHTML}
          exportData={reportData.items}
          exportColumns={[
            { key: 'customer_name', label: t.customer },
            { key: 'item_name', label: t.item },
            { key: 'rate', label: t.rate },
            { key: 'weight', label: t.weight },
            { key: 'amount', label: t.amount },
          ]}
        >
          <ScrollArea style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: 'center' }}>#</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.customer}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.item}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.rate}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.weight}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.amount}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reportData.items.map((item, index) => (
                  <Table.Tr key={item.id}>
                    <Table.Td style={{ textAlign: 'center' }}>{index + 1}</Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {item.customer_name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {item.item_name}
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
                  <Table.Td colSpan={3} style={{ textAlign: isUr ? 'right' : 'left' }}>
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

export default VendorStockBillReport;
