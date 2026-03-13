import {
  Stack,
  Grid,
  Select,
  Checkbox,
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
 * Concession Report (رعایت رپورٹ)
 * Shows sales with discounts/concessions
 */
export function ConcessionReport() {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [allClients, setAllClients] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [reportData, setReportData] = useState(null);

  const isUr = language === 'ur';
  const t = useMemo(
    () => ({
      fromDate: isUr ? 'تاریخ (سے)' : 'From Date',
      toDate: isUr ? 'تاریخ (تک)' : 'To Date',
      customer: isUr ? 'صارف' : 'Customer',
      all: isUr ? 'سب' : 'All',
      go: isUr ? 'تلاش' : 'Go',
      date: isUr ? 'تاریخ' : 'Date',
      saleNumber: isUr ? 'بل نمبر' : 'Sale #',
      concessionAmount: isUr ? 'رعایت کی رقم' : 'Concession Amount',
      totalConcession: isUr ? 'کل رعایت' : 'Total Concession',
      noRecords: isUr
        ? 'منتخب کردہ معیار کے لئے کوئی رعایت نہیں ملی'
        : 'No concessions found for the selected criteria',
      reportTitle: isUr ? 'رعایت رپورٹ' : 'Concession Report',
    }),
    [isUr]
  );

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await window.api.customers.getAll();
        if (response.success) {
          setCustomers(
            response.data.map((c) => ({
              value: String(c.id),
              label: formatDisplayName(c.name, c.name_english, isUr),
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, [isUr]);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatAmount = (num) => {
    return Math.round(num || 0).toLocaleString('en-US');
  };

  const handleGenerate = useCallback(async () => {
    if (!allClients && !selectedCustomer) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please select a customer or check "All Customers"',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await window.api.reports.getConcession({
        customerId: selectedCustomer ? parseInt(selectedCustomer) : null,
        dateFrom: formatDate(dateFrom),
        dateTo: formatDate(dateTo),
        allClients,
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
  }, [selectedCustomer, dateFrom, dateTo, allClients]);

  // ——— Professional Urdu-only print layout ———
  const printContentHTML = useMemo(() => {
    if (!reportData || reportData.transactions.length === 0) return null;

    const fmtAmount = (num) => Math.round(num || 0).toLocaleString('en-US');

    const rows = reportData.transactions
      .map(
        (row, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${row.customer_name}</td>
        <td class="amount-cell" style="text-align: left;">${row.sale_number}</td>
        <td class="amount-cell" style="text-align: left;">${new Date(row.sale_date).toLocaleDateString()}</td>
        <td class="amount-cell">Rs. ${fmtAmount(row.concession)}</td>
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
            <th colspan="5" class="section-header">${t.reportTitle}</th>
          </tr>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.customer}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.saleNumber}</th>
            <th style="width: 150px; text-align: left; direction: ltr;">${t.date}</th>
            <th style="width: 150px; text-align: left; direction: ltr;">${t.concessionAmount}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="4" style="text-align: left;">${t.totalConcession}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.totalConcession)}</td>
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
        <Grid.Col span={3}>
          <Select
            label={t.customer}
            placeholder=""
            data={customers}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            searchable
            clearable
            disabled={allClients}
          />
        </Grid.Col>
        <Grid.Col span={1}>
          <Checkbox
            label={t.all}
            checked={allClients}
            onChange={(e) => {
              setAllClients(e.target.checked);
              if (e.target.checked) setSelectedCustomer(null);
            }}
            mt="xl"
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
          title="Concession Report"
          titleUrdu="رعایت رپورٹ"
          dateRange={{ from: formatDate(dateFrom), to: formatDate(dateTo) }}
          printContentHTML={printContentHTML}
          exportData={reportData.transactions.map((row) => ({
            ...row,
            sale_date_formatted: new Date(row.sale_date).toLocaleDateString(),
          }))}
          exportColumns={[
            { key: 'sale_date_formatted', label: t.date },
            { key: 'sale_number', label: t.saleNumber },
            { key: 'customer_name', label: t.customer },
            { key: 'concession', label: t.concessionAmount },
          ]}
        >
          <ScrollArea style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>#</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.date}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.saleNumber}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.customer}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>
                    {t.concessionAmount}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reportData.transactions.map((row, index) => (
                  <Table.Tr key={row.id}>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>{index + 1}</Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {new Date(row.sale_date).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {row.sale_number}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {row.customer_name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatAmount(row.concession)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr className="font-bold bg-gray-100">
                  <Table.Td colSpan={4} style={{ textAlign: isUr ? 'right' : 'left' }}>
                    <strong>{t.totalConcession}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>{formatAmount(reportData.totalConcession)}</strong>
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

export default ConcessionReport;
