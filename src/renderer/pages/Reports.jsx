import { Paper, Stack, Tabs, Title, Group, ActionIcon } from '@mantine/core';
import {
  IconChartBar,
  IconReceipt,
  IconCalendar,
  IconBook,
  IconPackage,
  IconBoxMultiple,
  IconUsers,
  IconDiscount,
  IconFileDescription,
  IconArrowLeft,
  IconTruck,
  IconCalculator,
  IconClipboardList,
  IconHistory,
} from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';


import {
  ClientRecoveryReport,
  ItemSaleReport,
  DailySalesReport,
  LedgerReport,
  ItemPurchaseReport,
  StockReport,
  CustomerRegisterReport,
  ConcessionReport,
  DailySalesDetailsReport,
  VendorSalesReport,
  VendorStockBillReport,
  DailyNetAmountSummaryReport,
  StockSaleHistoryReport,
} from '../components/reports';
import useStore from '../store';

// Report tab definitions
const REPORT_TABS = [
  { key: 'client-recovery', label: 'Customer Recovery', urdu: 'گاہک بکری', icon: IconReceipt },
  { key: 'item-sale', label: 'Item Sale', urdu: 'مجملہ بکری', icon: IconChartBar },
  { key: 'daily-sales', label: 'Daily Sales', urdu: 'امروزہ بکری', icon: IconCalendar },
  { key: 'ledger', label: 'Ledger', urdu: 'کھاتہ', icon: IconBook },
  { key: 'item-purchase', label: 'Item Purchase', urdu: 'خریداری', icon: IconPackage },
  { key: 'stock', label: 'Stock', urdu: 'سٹاک رپورٹ', icon: IconBoxMultiple },
  {
    key: 'customer-register',
    label: 'Customer Register',
    urdu: 'رجسٹر کھاتہ رقم',
    icon: IconUsers,
  },
  { key: 'concession', label: 'Concession', urdu: 'رعایت رپورٹ', icon: IconDiscount },
  {
    key: 'daily-details',
    label: 'Daily Details',
    urdu: 'امروزہ بکری تفصیلات',
    icon: IconFileDescription,
  },
  { key: 'vendor-sales', label: 'Vendor Sales', urdu: 'بیوپاری بکری', icon: IconTruck },
  {
    key: 'vendor-stock-bill',
    label: 'Vendor Stock Bill',
    urdu: 'بیوپاری سٹاک بل',
    icon: IconClipboardList,
  },
  { key: 'net-summary', label: 'Net Summary', urdu: 'رجسٹر ٹوٹل رقم', icon: IconCalculator },
  {
    key: 'stock-sale-history',
    label: 'Stock Sale History',
    urdu: 'سٹاک بکری تاریخ',
    icon: IconHistory,
  },
];

/**
 * Reports Page
 * Main page with tabs for all 9 report types
 *
 * @param {function} onBack - Callback to navigate back to dashboard
 * @param {string} initialTab - Initial tab to display (optional)
 */
export function Reports({ onBack, initialTab = null }) {
  const { t } = useTranslation();
  const language = useStore((s) => s.language);
  const isUrdu = language === 'ur';
  // Use state with initialTab on first render only
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab && REPORT_TABS.some((t) => t.key === initialTab)) {
      return initialTab;
    }
    return 'client-recovery';
  });

  // Only update when initialTab changes after mount (e.g., App state changes)
  useEffect(() => {
    if (initialTab && REPORT_TABS.some((t) => t.key === initialTab) && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  const handleBack = () => {
    if (onBack) onBack();
  };

  const renderReportContent = () => {
    switch (activeTab) {
      case 'client-recovery':
        return <ClientRecoveryReport />;
      case 'item-sale':
        return <ItemSaleReport />;
      case 'daily-sales':
        return <DailySalesReport />;
      case 'ledger':
        return <LedgerReport />;
      case 'item-purchase':
        return <ItemPurchaseReport />;
      case 'stock':
        return <StockReport />;
      case 'customer-register':
        return <CustomerRegisterReport />;
      case 'concession':
        return <ConcessionReport />;
      case 'daily-details':
        return <DailySalesDetailsReport />;
      case 'vendor-sales':
        return <VendorSalesReport />;
      case 'vendor-stock-bill':
        return <VendorStockBillReport />;
      case 'net-summary':
        return <DailyNetAmountSummaryReport />;
      case 'stock-sale-history':
        return <StockSaleHistoryReport />;
      default:
        return <ClientRecoveryReport />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <Paper shadow="md" p="md" radius="md" className="max-w-[1400px] mx-auto">
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between" align="center">
            <Group>
              <ActionIcon variant="subtle" size="lg" onClick={handleBack}>
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Title order={3}>{t('report.title')}</Title>
            </Group>
          </Group>

          {/* Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List grow>
              {REPORT_TABS.map((tab) => (
                <Tabs.Tab key={tab.key} value={tab.key} leftSection={<tab.icon size={16} />}>
                  {isUrdu ? tab.urdu : tab.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            {/* Tab Panels */}
            {REPORT_TABS.map((tab) => (
              <Tabs.Panel key={tab.key} value={tab.key} pt="md">
                {activeTab === tab.key && renderReportContent()}
              </Tabs.Panel>
            ))}
          </Tabs>
        </Stack>
      </Paper>
    </div>
  );
}

Reports.propTypes = {
  onBack: PropTypes.func,
  initialTab: PropTypes.string,
};

export default Reports;
