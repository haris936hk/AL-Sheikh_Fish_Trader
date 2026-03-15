import {
  Stack,
  Grid,
  Select,
  Button,
  Table,
  LoadingOverlay,
  Text,
  ScrollArea,
  Paper,
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
 * Ledger Report (کھاتہ)
 * Shows account ledger for customer or supplier
 */
export function LedgerReport() {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountType, setAccountType] = useState('customer');
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [reportData, setReportData] = useState(null);

  const isUr = language === 'ur';
  const { t: translate } = useTranslation();
  const t = useMemo(
    () => ({
      accountType: translate('ledger.accountType', 'Account Type'),
      customerType: translate('common.customer', 'Customer'),
      vendorType: translate('common.vendor', 'Vendor'),
      account: translate('common.account', 'Account'),
      fromDate: translate('common.dateFrom', 'From Date'),
      toDate: translate('common.dateTo', 'To Date'),
      go: translate('common.go', 'Go'),
      reportTitle: translate('ledger.title', 'Ledger Report'),
      openingBalance: translate('ledger.openingBalance', 'Opening Balance'),
      date: translate('common.date', 'Date'),
      reference: translate('common.reference', 'Reference'),
      description: translate('common.description', 'Description'),
      debit: translate('ledger.debit', 'Debit'),
      credit: translate('ledger.credit', 'Credit'),
      balance: translate('common.balance', 'Balance'),
      totals: translate('common.totals', 'Totals'),
      selectAccountMsg: translate('error.selectAccount', 'Please select an account'),
      noRecords: translate('common.noRecords', 'No transactions found for the selected criteria'),
    }),
    [translate]
  );

  // Fetch accounts based on type
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        let response;
        if (accountType === 'customer') {
          response = await window.api.customers.getAll();
        } else {
          response = await window.api.suppliers.getAll();
        }
        if (response.success) {
          setAccounts(
            response.data.map((a) => ({
              value: String(a.id),
              label: formatDisplayName(a.name, a.name_english, isUr),
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };
    fetchAccounts();
    setSelectedAccount(null);
  }, [accountType, isUr]);

  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    return date.toISOString().split('T')[0];
  };

  const formatAmount = (num) => {
    return Math.round(num || 0).toLocaleString('en-US');
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedAccount) {
      notifications.show({
        title: 'Validation Error',
        message: t.selectAccountMsg,
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await window.api.reports.getLedger({
        accountId: parseInt(selectedAccount),
        accountType,
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
  }, [selectedAccount, accountType, dateFrom, dateTo, t]);

  // Calculate running balance
  const getTransactionsWithBalance = useCallback(() => {
    if (!reportData) return [];
    let balance = reportData.openingBalance;
    return reportData.transactions.map((txn) => {
      balance = balance + (txn.debit || 0) - (txn.credit || 0);
      return { ...txn, balance };
    });
  }, [reportData]);

  // ——— Professional Urdu-only print layout ———
  const printContentHTML = useMemo(() => {
    if (!reportData) return null;

    const fmtAmount = (num) => Math.round(num || 0).toLocaleString('en-US');

    const txnsWithBalance = getTransactionsWithBalance();

    const rows = txnsWithBalance
      .map(
        (txn, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td class="amount-cell" style="text-align: left;">${new Date(txn.date).toLocaleDateString()}</td>
        <td class="amount-cell" style="text-align: left;">${txn.reference || '-'}</td>
        <td style="text-align: ${isUr ? 'right' : 'left'};">${txn.description || '-'}</td>
        <td class="amount-cell">${txn.debit > 0 ? fmtAmount(txn.debit) : '-'}</td>
        <td class="amount-cell">${txn.credit > 0 ? fmtAmount(txn.credit) : '-'}</td>
        <td class="amount-cell">Rs. ${fmtAmount(txn.balance)}</td>
      </tr>
    `
      )
      .join('');

    const totalDebit = reportData.transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    const totalCredit = reportData.transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
    const finalBalance =
      txnsWithBalance.length > 0
        ? txnsWithBalance[txnsWithBalance.length - 1].balance
        : reportData.openingBalance;

    return `
      <style>
        .print-table { width: 100%; border-collapse: collapse; margin: 14px 0; direction: ${isUr ? 'rtl' : 'ltr'}; }
        .print-table th, .print-table td { border: 1px solid #000; padding: 8px 14px; font-size: 14px; text-align: ${isUr ? 'right' : 'left'}; }
        .print-table th { background-color: #e8e8e8; font-weight: bold; font-size: 13px; }
        .print-table .section-header { background-color: #f5f5f5; font-weight: bold; font-size: 14px; text-align: center; }
        .print-table .amount-cell { text-align: left; direction: ltr; font-family: 'Segoe UI', Tahoma, sans-serif; white-space: nowrap; }
        .print-table .total-row { background-color: #f0f0f0; font-weight: bold; font-size: 15px; }
        .balance-info { padding: 10px; margin-bottom: 15px; border: 1px solid #000; direction: ${isUr ? 'rtl' : 'ltr'}; background-color: #fafafa; font-weight: bold; font-size: 15px; text-align: ${isUr ? 'right' : 'left'}; }
      </style>

      <div class="balance-info">
        ${t.openingBalance}: <span class="amount-cell" style="display:inline-block; margin-${isUr ? 'right' : 'left'}: 10px;">Rs. ${fmtAmount(reportData.openingBalance)}</span>
      </div>

      <table class="print-table">
        <thead>
          <tr>
            <th colspan="7" class="section-header">${t.reportTitle}</th>
          </tr>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="width: 100px; text-align: left; direction: ltr;">${t.date}</th>
            <th style="width: 100px; text-align: left; direction: ltr;">${t.reference}</th>
            <th style="text-align: ${isUr ? 'right' : 'left'};">${t.description}</th>
            <th style="width: 100px; text-align: left; direction: ltr;">${t.debit}</th>
            <th style="width: 100px; text-align: left; direction: ltr;">${t.credit}</th>
            <th style="width: 120px; text-align: left; direction: ltr;">${t.balance}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="4" style="text-align: ${isUr ? 'right' : 'left'};">${t.totals}</td>
            <td class="amount-cell">${fmtAmount(totalDebit)}</td>
            <td class="amount-cell">${fmtAmount(totalCredit)}</td>
            <td class="amount-cell">Rs. ${fmtAmount(finalBalance)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }, [reportData, getTransactionsWithBalance, t, isUr]);

  return (
    <Stack gap="md" pos="relative">
      <LoadingOverlay visible={loading} />

      {/* Filters */}
      <Grid align="flex-end" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
        <Grid.Col span={2}>
          <Select
            label={t.accountType}
            data={[
              { value: 'customer', label: t.customerType },
              { value: 'supplier', label: t.vendorType },
            ]}
            value={accountType}
            onChange={setAccountType}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            label={t.account}
            placeholder=""
            data={accounts}
            value={selectedAccount}
            onChange={setSelectedAccount}
            searchable
            clearable
            required
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <DatePickerInput
            label={t.fromDate}
            value={dateFrom}
            onChange={setDateFrom}
            maxDate={dateTo}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <DatePickerInput
            label={t.toDate}
            value={dateTo}
            onChange={setDateTo}
            minDate={dateFrom}
            maxDate={new Date()}
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
          title="Ledger Report"
          titleUrdu="کھاتہ"
          dateRange={{ from: formatDate(dateFrom), to: formatDate(dateTo) }}
          printContentHTML={printContentHTML}
          exportData={getTransactionsWithBalance().map((row) => ({
            ...row,
            txn_date_formatted: new Date(row.date).toLocaleDateString(),
          }))}
          exportColumns={[
            { key: 'txn_date_formatted', label: t.date },
            { key: 'reference', label: t.reference },
            { key: 'description', label: t.description },
            { key: 'debit', label: t.debit },
            { key: 'credit', label: t.credit },
            { key: 'balance', label: t.balance },
          ]}
        >
          <ScrollArea style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            {/* Opening Balance */}
            <Paper p="sm" mb="md" withBorder>
              <Text style={{ textAlign: isUr ? 'right' : 'left' }}>
                <strong>{t.openingBalance}:</strong>{' '}
                <span style={{ direction: 'ltr', display: 'inline-block' }}>
                  {formatAmount(reportData.openingBalance)}
                </span>
              </Text>
            </Paper>

            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>#</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.date}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.reference}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>
                    {t.description}
                  </Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.debit}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.credit}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.balance}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {getTransactionsWithBalance().map((txn, index) => (
                  <Table.Tr key={index}>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>{index + 1}</Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {new Date(txn.date).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {txn.reference}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {txn.description}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {txn.debit > 0 ? formatAmount(txn.debit) : '-'}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {txn.credit > 0 ? formatAmount(txn.credit) : '-'}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {formatAmount(txn.balance)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr className="font-bold bg-gray-100">
                  <Table.Td colSpan={4} style={{ textAlign: isUr ? 'right' : 'left' }}>
                    <strong>{t.totals}</strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>
                      {formatAmount(
                        reportData.transactions.reduce((sum, txn) => sum + (txn.debit || 0), 0)
                      )}
                    </strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>
                      {formatAmount(
                        reportData.transactions.reduce((sum, txn) => sum + (txn.credit || 0), 0)
                      )}
                    </strong>
                  </Table.Td>
                  <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                    <strong>
                      {formatAmount(
                        getTransactionsWithBalance().slice(-1)[0]?.balance ??
                        reportData.openingBalance
                      )}
                    </strong>
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

export default LedgerReport;
