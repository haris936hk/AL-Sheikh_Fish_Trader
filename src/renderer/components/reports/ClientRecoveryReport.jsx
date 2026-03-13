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
 * Client Recovery Report (کلائنٹ بکری)
 * Shows sales summary for clients with collection and balance details
 */
export function ClientRecoveryReport() {
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
      customerName: isUr ? 'صارف کا نام' : 'Customer Name',
      totalAmount: isUr ? 'کل رقم' : 'Total Amount',
      charges: isUr ? 'اخراجات' : 'Charges',
      collection: isUr ? 'وصولی' : 'Collection',
      discount: isUr ? 'رعایت' : 'Discount',
      balance: isUr ? 'بقایا' : 'Balance',
      grandTotal: isUr ? 'کل' : 'Grand Total',
      noRecords: isUr
        ? 'منتخب کردہ معیار کے لئے کوئی ریکارڈ نہیں ملا'
        : 'No records found for the selected criteria',
      reportTitle: isUr ? 'کلائنٹ بکری تفصیلات' : 'Client Recovery Details',
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

  const formatNumber = (num) => {
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
      const response = await window.api.reports.getClientRecovery({
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
    if (!reportData || reportData.summary.length === 0) return null;

    const fmt = (num) =>
      Math.round(num || 0).toLocaleString('en-US');

    const totalAmount = reportData.summary.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const totalCharges = reportData.summary.reduce((sum, r) => sum + (r.total_charges || 0), 0);
    const totalCollection = reportData.summary.reduce(
      (sum, r) => sum + (r.total_collection || 0),
      0
    );
    const totalDiscount = reportData.summary.reduce((sum, r) => sum + (r.total_discount || 0), 0);
    const totalBalance = reportData.summary.reduce((sum, r) => sum + (r.total_balance || 0), 0);

    const rows = reportData.summary
      .map(
        (row, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${row.customer_name}</td>
        <td class="amount-cell">Rs. ${fmt(row.total_amount)}</td>
        <td class="amount-cell">Rs. ${fmt(row.total_charges)}</td>
        <td class="amount-cell">Rs. ${fmt(row.total_collection)}</td>
        <td class="amount-cell">Rs. ${fmt(row.total_discount)}</td>
        <td class="amount-cell">Rs. ${fmt(row.total_balance)}</td>
      </tr>
    `
      )
      .join('');

    return `
      <style>
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 14px 0;
          direction: ${isUr ? 'rtl' : 'ltr'};
        }
        .print-table th,
        .print-table td {
          border: 1px solid #000;
          padding: 8px 14px;
          font-size: 14px;
          text-align: ${isUr ? 'right' : 'left'};
        }
        .print-table th {
          background-color: #e8e8e8;
          font-weight: bold;
          font-size: 13px;
        }
        .print-table .section-header {
          background-color: #f5f5f5;
          font-weight: bold;
          font-size: 14px;
          text-align: center;
        }
        .print-table .amount-cell {
          text-align: left;
          direction: ltr;
          font-family: 'Segoe UI', Tahoma, sans-serif;
          white-space: nowrap;
        }
        .print-table .total-row {
          background-color: #f0f0f0;
          font-weight: bold;
          font-size: 15px;
        }
      </style>

      <table class="print-table">
        <thead>
          <tr>
            <th colspan="7" class="section-header">${t.reportTitle}</th>
          </tr>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.customerName}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.totalAmount}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.charges}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.collection}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.discount}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.balance}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="2" style="text-align: ${isUr ? 'right' : 'left'};">${t.grandTotal}</td>
            <td class="amount-cell">Rs. ${fmt(totalAmount)}</td>
            <td class="amount-cell">Rs. ${fmt(totalCharges)}</td>
            <td class="amount-cell">Rs. ${fmt(totalCollection)}</td>
            <td class="amount-cell">Rs. ${fmt(totalDiscount)}</td>
            <td class="amount-cell">Rs. ${fmt(totalBalance)}</td>
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
          title="Customer Recovery Report"
          titleUrdu="کلائنٹ بکری"
          dateRange={{ from: formatDate(dateFrom), to: formatDate(dateTo) }}
          printContentHTML={printContentHTML}
          exportData={reportData.summary}
          exportColumns={[
            { key: 'customer_name', label: t.customerName },
            { key: 'total_amount', label: t.totalAmount },
            { key: 'total_charges', label: t.charges },
            { key: 'total_collection', label: t.collection },
            { key: 'total_discount', label: t.discount },
            { key: 'total_balance', label: t.balance },
          ]}
        >
          <ScrollArea style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            {/* Summary Table */}
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>#</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>
                    {t.customerName}
                  </Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>
                    {t.totalAmount}
                  </Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.charges}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.collection}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.discount}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.balance}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reportData.summary.map((row, index) => (
                  <Table.Tr key={row.customer_id}>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>{index + 1}</Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {row.customer_name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(row.total_amount)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(row.total_charges)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(row.total_collection)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(row.total_discount)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatNumber(row.total_balance)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr className="font-bold bg-gray-100">
                  <Table.Td colSpan={2} style={{ textAlign: isUr ? 'right' : 'left' }}>
                    <strong>{t.grandTotal}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>
                      {formatNumber(
                        reportData.summary.reduce((sum, r) => sum + (r.total_amount || 0), 0)
                      )}
                    </strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>
                      {formatNumber(
                        reportData.summary.reduce((sum, r) => sum + (r.total_charges || 0), 0)
                      )}
                    </strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>
                      {formatNumber(
                        reportData.summary.reduce((sum, r) => sum + (r.total_collection || 0), 0)
                      )}
                    </strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>
                      {formatNumber(
                        reportData.summary.reduce((sum, r) => sum + (r.total_discount || 0), 0)
                      )}
                    </strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>
                      {formatNumber(
                        reportData.summary.reduce((sum, r) => sum + (r.total_balance || 0), 0)
                      )}
                    </strong>
                  </Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>

            {reportData.summary.length === 0 && (
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

export default ClientRecoveryReport;
