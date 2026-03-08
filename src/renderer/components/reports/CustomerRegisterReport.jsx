import { Stack, Grid, Button, Table, LoadingOverlay, Text, ScrollArea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useState, useCallback, useMemo } from 'react';

import useStore from '../../store';
import { ReportViewer } from '../ReportViewer';

/**
 * Customer Register Report (رجسٹر کھاتہ رقم)
 * Shows account balances for all customers as of a specific date
 */
export function CustomerRegisterReport() {
  const { language } = useStore();
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);

  const isUr = language === 'ur';
  const t = useMemo(
    () => ({
      asOfDate: isUr ? 'تاریخ' : 'As of Date',
      go: isUr ? 'تلاش' : 'Go',
      customer: isUr ? 'صارف کا نام' : 'Customer Name',
      code: isUr ? 'کوڈ' : 'Code',
      openingBalance: isUr ? 'سابقہ بقایا' : 'Opening Balance',
      netAmount: isUr ? 'کل رقم' : 'Net Amount',
      collection: isUr ? 'وصولی' : 'Collection',
      balance: isUr ? 'بقایا' : 'Balance',
      total: isUr ? 'کل' : 'Total',
      noRecords: isUr ? 'کوئی صارف نہیں ملا' : 'No customers found',
      reportTitle: isUr ? 'رجسٹر کھاتہ رقم' : 'Customer Register',
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
      const response = await window.api.reports.getCustomerRegister({
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
    if (!reportData || reportData.customers.length === 0) return null;

    const fmt = (num) =>
      (num || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const rows = reportData.customers
      .map(
        (cust, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${cust.customer_name}</td>
        <td class="amount-cell" style="text-align: left;">${cust.code}</td>
        <td class="amount-cell">Rs. ${fmt(cust.opening_balance)}</td>
        <td class="amount-cell">Rs. ${fmt(cust.net_amount)}</td>
        <td class="amount-cell">Rs. ${fmt(cust.collection)}</td>
        <td class="amount-cell" style="color: ${cust.balance > 0 ? 'red' : cust.balance < 0 ? 'green' : 'black'}; font-weight: bold;">
          Rs. ${fmt(cust.balance)}
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
            <th colspan="7" class="section-header">${t.reportTitle}</th>
          </tr>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.customer}</th>
            <th style="width: 80px; text-align: left; direction: ltr;">${t.code}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.openingBalance}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.netAmount}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.collection}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.balance}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="3" style="text-align: ${isUr ? 'right' : 'left'};">${t.total}</td>
            <td class="amount-cell">Rs. ${fmt(reportData.totals.previous)}</td>
            <td class="amount-cell">Rs. ${fmt(reportData.totals.net_amount)}</td>
            <td class="amount-cell">Rs. ${fmt(reportData.totals.collection)}</td>
            <td class="amount-cell">Rs. ${fmt(reportData.totals.balance)}</td>
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
          title="Customer Register"
          titleUrdu="رجسٹر کھاتہ رقم"
          singleDate={formatDate(asOfDate)}
          printContentHTML={printContentHTML}
          exportData={reportData.customers}
          exportColumns={[
            { key: 'code', label: t.code },
            { key: 'customer_name', label: t.customer },
            { key: 'opening_balance', label: t.openingBalance },
            { key: 'net_amount', label: t.netAmount },
            { key: 'collection', label: t.collection },
            { key: 'balance', label: t.balance },
          ]}
        >
          <ScrollArea style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>#</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.code}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.customer}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>
                    {t.openingBalance}
                  </Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.netAmount}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.collection}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.balance}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reportData.customers.map((cust, index) => (
                  <Table.Tr key={cust.id}>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>{index + 1}</Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {cust.code}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {cust.customer_name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(cust.opening_balance)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(cust.net_amount)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(cust.collection)}
                    </Table.Td>
                    <Table.Td
                      style={{
                        textAlign: isUr ? 'left' : 'right',
                        direction: 'ltr',
                        color: cust.balance > 0 ? 'red' : cust.balance < 0 ? 'green' : 'black',
                        fontWeight: 'bold',
                      }}
                    >
                      {formatNumber(cust.balance)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr className="font-bold bg-gray-100">
                  <Table.Td colSpan={3} style={{ textAlign: isUr ? 'right' : 'left' }}>
                    <strong>{t.total}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatNumber(reportData.totals.previous)}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatNumber(reportData.totals.net_amount)}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatNumber(reportData.totals.collection)}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatNumber(reportData.totals.balance)}</strong>
                  </Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>

            {reportData.customers.length === 0 && (
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

export default CustomerRegisterReport;
