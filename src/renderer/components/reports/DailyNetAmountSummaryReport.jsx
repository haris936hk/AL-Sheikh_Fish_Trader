import {
  Stack,
  Grid,
  Button,
  LoadingOverlay,
  Text,
  Paper,
  SimpleGrid,
  Table,
  Checkbox,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconCash, IconReceipt, IconCreditCard, IconWallet } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { useState, useCallback, useMemo } from 'react';

import useStore from '../../store';
import { ReportViewer } from '../ReportViewer';

/**
 * Daily Net Amount Summary Report (8.11) - رجسٹر ٹوٹل رقم
 * Shows day-end reconciliation summary with previous balance, sales, collections, and closing balance
 */
export function DailyNetAmountSummaryReport() {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date());
  const [compareDate, setCompareDate] = useState(null);
  const [enableCompare, setEnableCompare] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [compareData, setCompareData] = useState(null);

  // Translation helpers
  const isUr = language === 'ur';

  const t = useMemo(
    () => ({
      previousBalance: isUr ? 'سابقہ بقایا' : 'Previous Balance',
      todaySales: isUr ? 'آج کی بکری' : "Today's Sales",
      todayCharges: isUr ? 'آج کے اخراجات (کرایہ + برف)' : "Today's Charges (Fare + Ice)",
      todayDiscount: isUr ? 'آج کی رعایت' : "Today's Discount",
      totalAmount: isUr ? 'کل رقم' : 'Total Amount',
      cashReceived: isUr ? 'نقد وصولی (بکری سے)' : 'Cash Received (Sale)',
      paymentsReceived: isUr ? 'ادائیگیاں' : 'Payments Received',
      totalCollection: isUr ? 'کل وصولی' : 'Total Collection',
      closingBalance: isUr ? 'بقایا رقم' : 'Closing Balance',
      details: isUr ? 'تفصیلات' : 'Details',
      item: isUr ? 'مد' : 'Item',
      amount: isUr ? 'رقم' : 'Amount',
      collectionDetails: isUr ? 'وصولی کی تفصیلات' : 'Collection Details',
      finalAccount: isUr ? 'حتمی حساب' : 'Balance Calculation',
      dateComparison: isUr ? 'تاریخ کا موازنہ' : 'Date Comparison',
      metric: isUr ? 'تفصیل' : 'Metric',
      difference: isUr ? 'فرق' : 'Difference',
      trend: isUr ? 'رجحان' : 'Trend',
    }),
    [isUr]
  );

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatAmount = (num) => {
    return Math.round(num || 0).toLocaleString('en-US');
  };

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.api.reports.getDailyNetSummary({
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

    // Fetch comparison data if enabled
    if (enableCompare && compareDate) {
      try {
        const compareResponse = await window.api.reports.getDailyNetSummary({
          asOfDate: formatDate(compareDate),
        });
        if (compareResponse.success) {
          setCompareData(compareResponse.data);
        }
      } catch (err) {
        console.error('Compare date fetch error:', err);
      }
    } else {
      setCompareData(null);
    }
  }, [asOfDate, compareDate, enableCompare]);

  const SummaryCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="xs">
        <div className="flex items-center justify-between">
          <Text size="sm" c="dimmed" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            {title}
          </Text>
          <Icon size={24} color={`var(--mantine-color-${color}-6)`} />
        </div>
        <Text
          size="xl"
          fw={700}
          c={color}
          style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}
        >
          Rs. {formatAmount(value)}
        </Text>
      </Stack>
    </Paper>
  );

  SummaryCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.number,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string,
  };

  // ——— Professional Urdu-only print layout ———
  const printContentHTML = useMemo(() => {
    if (!reportData) return null;

    const fmtAmount = (num) => Math.round(num || 0).toLocaleString('en-US');

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
        .print-table .grand-total-row {
          background-color: #ddd;
          font-weight: bold;
          font-size: 16px;
          border-top: 2px solid #000;
        }
        .print-table .operator {
          text-align: center;
          width: 40px;
          font-weight: bold;
          font-size: 16px;
        }
      </style>

      <!-- Main Summary Table -->
      <table class="print-table">
        <thead>
          <tr>
            <th colspan="3" class="section-header">${t.details}</th>
          </tr>
          <tr>
            <th style="width: 40px; text-align: center;"></th>
            <th>${t.item}</th>
            <th style="width: 180px;">${t.amount}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="operator"></td>
            <td>${t.previousBalance}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.previousBalance)}</td>
          </tr>
          <tr>
            <td class="operator">+</td>
            <td>${t.todaySales}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.todaySales)}</td>
          </tr>
          <tr>
            <td class="operator">+</td>
            <td>${t.todayCharges}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.todayCharges)}</td>
          </tr>
          <tr>
            <td class="operator">−</td>
            <td>${t.todayDiscount}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.todayDiscount)}</td>
          </tr>
          <tr class="total-row">
            <td class="operator">=</td>
            <td>${t.totalAmount}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Collection Details -->
      <table class="print-table">
        <thead>
          <tr>
            <th colspan="3" class="section-header">${t.collectionDetails}</th>
          </tr>
          <tr>
            <th style="width: 40px; text-align: center;"></th>
            <th>${t.item}</th>
            <th style="width: 180px;">${t.amount}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="operator"></td>
            <td>${t.cashReceived}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.todayCollection)}</td>
          </tr>
          <tr>
            <td class="operator">+</td>
            <td>${t.paymentsReceived}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.todayPayments)}</td>
          </tr>
          <tr class="total-row">
            <td class="operator">=</td>
            <td>${t.totalCollection}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.totalCollection)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Closing Balance -->
      <table class="print-table">
        <thead>
          <tr>
            <th colspan="3" class="section-header">${t.finalAccount}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="operator"></td>
            <td>${t.totalAmount}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.totalAmount)}</td>
          </tr>
          <tr>
            <td class="operator">−</td>
            <td>${t.totalCollection}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.totalCollection)}</td>
          </tr>
          <tr class="grand-total-row">
            <td class="operator">=</td>
            <td>${t.closingBalance}</td>
            <td class="amount-cell">Rs. ${fmtAmount(reportData.closingBalance)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }, [reportData, t, isUr]);

  return (
    <Stack gap="md" pos="relative">
      <LoadingOverlay visible={loading} />

      {/* Filters */}
      <Grid align="flex-end">
        <Grid.Col span={4}>
          <DatePickerInput
            label={isUr ? 'تاریخ' : 'Date'}
            value={asOfDate}
            onChange={setAsOfDate}
            maxDate={new Date()}
          />
        </Grid.Col>
        <Grid.Col span={1}>
          <Checkbox
            label={isUr ? 'موازنہ' : 'Compare'}
            checked={enableCompare}
            onChange={(e) => {
              setEnableCompare(e.target.checked);
              if (!e.target.checked) setCompareData(null);
            }}
            mt="xl"
          />
        </Grid.Col>
        {enableCompare && (
          <Grid.Col span={3}>
            <DatePickerInput
              label={isUr ? 'تاریخ موازنہ' : 'Compare Date'}
              value={compareDate}
              onChange={setCompareDate}
              maxDate={new Date()}
            />
          </Grid.Col>
        )}
        <Grid.Col span={2}>
          <Button leftSection={<IconSearch size={16} />} onClick={handleGenerate} fullWidth>
            {isUr ? 'تلاش' : 'Go'}
          </Button>
        </Grid.Col>
      </Grid>

      {reportData && (
        <ReportViewer
          title="Daily Net Amount Summary"
          titleUrdu="رجسٹر ٹوٹل رقم"
          singleDate={formatDate(asOfDate)}
          printContentHTML={printContentHTML}
          exportData={[
            { category: t.details, metric: t.previousBalance, amount: reportData.previousBalance },
            { category: t.details, metric: t.todaySales, amount: reportData.todaySales },
            { category: t.details, metric: t.todayCharges, amount: reportData.todayCharges },
            { category: t.details, metric: t.todayDiscount, amount: reportData.todayDiscount },
            { category: t.details, metric: t.totalAmount, amount: reportData.totalAmount },

            {
              category: t.collectionDetails,
              metric: t.cashReceived,
              amount: reportData.todayCollection,
            },
            {
              category: t.collectionDetails,
              metric: t.paymentsReceived,
              amount: reportData.todayPayments,
            },
            {
              category: t.collectionDetails,
              metric: t.totalCollection,
              amount: reportData.totalCollection,
            },

            {
              category: t.finalAccount,
              metric: t.closingBalance,
              amount: reportData.closingBalance,
            },
          ]}
          exportColumns={[
            { key: 'category', label: 'Category' },
            { key: 'metric', label: t.metric },
            { key: 'amount', label: t.amount },
          ]}
        >
          <Stack gap="lg" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
            {/* Summary Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md">
              <SummaryCard
                title={t.previousBalance}
                value={reportData.previousBalance}
                icon={IconWallet}
                color="gray"
              />
              <SummaryCard
                title={t.todaySales}
                value={reportData.todaySales}
                icon={IconReceipt}
                color="blue"
              />
              <SummaryCard
                title={t.totalAmount}
                value={reportData.totalAmount}
                icon={IconCash}
                color="indigo"
              />
              <SummaryCard
                title={t.totalCollection}
                value={reportData.totalCollection}
                icon={IconCreditCard}
                color="green"
              />
              <SummaryCard
                title={t.closingBalance}
                value={reportData.closingBalance}
                icon={IconWallet}
                color="red"
              />
            </SimpleGrid>

            {/* Detailed Breakdown */}
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Text fw={600} mb="md">
                {t.details}
              </Text>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <Stack gap="sm">
                  <div className="flex justify-between">
                    <Text size="sm" c="dimmed">
                      {t.todaySales}:
                    </Text>
                    <Text size="sm" style={{ direction: 'ltr' }}>
                      Rs. {formatAmount(reportData.todaySales)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" c="dimmed">
                      {t.todayCharges}:
                    </Text>
                    <Text size="sm" style={{ direction: 'ltr' }}>
                      Rs. {formatAmount(reportData.todayCharges)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" c="dimmed">
                      {t.todayDiscount}:
                    </Text>
                    <Text size="sm" style={{ direction: 'ltr' }}>
                      Rs. {formatAmount(reportData.todayDiscount)}
                    </Text>
                  </div>
                </Stack>
                <Stack gap="sm">
                  <div className="flex justify-between">
                    <Text size="sm" c="dimmed">
                      {t.cashReceived}:
                    </Text>
                    <Text size="sm" style={{ direction: 'ltr' }}>
                      Rs. {formatAmount(reportData.todayCollection)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="sm" c="dimmed">
                      {t.paymentsReceived}:
                    </Text>
                    <Text size="sm" style={{ direction: 'ltr' }}>
                      Rs. {formatAmount(reportData.todayPayments)}
                    </Text>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <Text size="sm" fw={500}>
                      {t.totalCollection}:
                    </Text>
                    <Text size="sm" fw={500} style={{ direction: 'ltr' }}>
                      Rs. {formatAmount(reportData.totalCollection)}
                    </Text>
                  </div>
                </Stack>
              </SimpleGrid>
            </Paper>

            {/* Balance Calculation */}
            <Paper shadow="sm" p="lg" radius="md" withBorder bg="gray.0">
              <Text fw={600} mb="md">
                {t.finalAccount}
              </Text>
              <Stack gap="xs">
                <div className="flex justify-between">
                  <Text>{t.previousBalance}:</Text>
                  <Text fw={500} style={{ direction: 'ltr' }}>
                    Rs. {formatAmount(reportData.previousBalance)}
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text>
                    {isUr ? '+' : '+'} {t.todaySales}:
                  </Text>
                  <Text fw={500} style={{ direction: 'ltr' }}>
                    Rs. {formatAmount(reportData.todaySales)}
                  </Text>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <Text fw={500}>
                    {isUr ? '=' : '='} {t.totalAmount}:
                  </Text>
                  <Text fw={600} style={{ direction: 'ltr' }}>
                    Rs. {formatAmount(reportData.totalAmount)}
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text>
                    {isUr ? '−' : '-'} {t.totalCollection}:
                  </Text>
                  <Text fw={500} style={{ direction: 'ltr' }}>
                    Rs. {formatAmount(reportData.totalCollection)}
                  </Text>
                </div>
                <div
                  className="flex justify-between border-t pt-2 mt-2"
                  style={{ borderTopWidth: 2 }}
                >
                  <Text size="lg" fw={700}>
                    {t.closingBalance}:
                  </Text>
                  <Text size="lg" fw={700} c="red" style={{ direction: 'ltr' }}>
                    Rs. {formatAmount(reportData.closingBalance)}
                  </Text>
                </div>
              </Stack>
            </Paper>

            {/* Multi-Date Comparison Table (FR-NETSUMMARY-021) */}
            {compareData && (
              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Text fw={600} mb="md">
                  {t.dateComparison}
                </Text>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.metric}</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>
                        {new Date(asOfDate).toLocaleDateString('en-GB')}
                      </Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>
                        {new Date(compareDate).toLocaleDateString('en-GB')}
                      </Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>{t.difference}</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>{t.trend}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {[
                      { label: t.previousBalance, key: 'previousBalance' },
                      { label: t.todaySales, key: 'todaySales' },
                      { label: t.totalAmount, key: 'totalAmount' },
                      { label: t.totalCollection, key: 'totalCollection' },
                      { label: t.closingBalance, key: 'closingBalance' },
                    ].map((metric) => {
                      const val1 = reportData[metric.key] || 0;
                      const val2 = compareData[metric.key] || 0;
                      const diff = val1 - val2;
                      return (
                        <Table.Tr key={metric.key}>
                          <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                            {metric.label}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center', direction: 'ltr' }}>
                            Rs. {formatAmount(val1)}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center', direction: 'ltr' }}>
                            Rs. {formatAmount(val2)}
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center', direction: 'ltr' }}>
                            <Text c={diff > 0 ? 'red' : diff < 0 ? 'green' : 'dimmed'} size="sm">
                              Rs. {formatAmount(Math.abs(diff))}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center' }}>
                            <Text size="lg" c={diff > 0 ? 'red' : diff < 0 ? 'green' : 'dimmed'}>
                              {diff > 0 ? '↑' : diff < 0 ? '↓' : '—'}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Stack>
        </ReportViewer>
      )}
    </Stack>
  );
}

export default DailyNetAmountSummaryReport;
