import {
  Title,
  Text,
  Card,
  SimpleGrid,
  Stack,
  Group,
  Loader,
  Center,
  Paper,
  Box,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Button,
  Divider,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconWorld,
  IconRefresh,
  IconClock,
  IconFish,
  IconFileInvoice,
  IconPackage,
  IconCash,
  IconShoppingCart,
  IconUsers,
  IconTruck,
  IconNotebook,
  IconTrendingUp,
  IconClipboardList,
  IconReceipt,
  IconCalendar,
  IconCalendarStats,
  IconDiscount2,
  IconChartBar,
  IconFolder,
  IconArrowsExchange,
  IconAddressBook,
  IconReportAnalytics,
  IconCoins,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { useEffect, useCallback, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { DashboardButton, SupplierAdvancesList, ItemStockDisplay } from '../components';
import useStore from '../store';

// Stats card component
const StatCard = memo(({ value, label, icon: Icon, color }) => (
  <Paper
    p="md"
    radius="md"
    style={{
      background: '#1e293b',
      border: '1px solid rgba(255,255,255,0.06)',
      minWidth: '120px',
      flex: 1,
    }}
  >
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon variant="light" color={color} size="lg" radius="md">
        <Icon size={18} />
      </ThemeIcon>
      <Stack gap={0}>
        <Text c="white" size="lg" fw={700} lh={1.2}>
          {value}
        </Text>
        <Text c="dimmed" size="xs" lh={1.2}>
          {label}
        </Text>
      </Stack>
    </Group>
  </Paper>
));
StatCard.displayName = 'StatCard';

StatCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
};

// Section header component
const SectionHeader = memo(({ icon: Icon, label, color }) => (
  <Group gap="sm" mb="sm">
    <ThemeIcon variant="light" color={color} size="md" radius="md">
      <Icon size={16} />
    </ThemeIcon>
    <Title order={5} c="dark" fw={600}>
      {label}
    </Title>
  </Group>
));
SectionHeader.displayName = 'SectionHeader';

SectionHeader.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

/**
 * Dashboard Page Component
 * Central navigation hub. Implements FR-DASH-001 through FR-DASH-027.
 */
function Dashboard({ onNavigate, onToggleLanguage }) {
  const supplierAdvances = useStore((s) => s.supplierAdvances);
  const itemsStock = useStore((s) => s.itemsStock);
  const dashboardSummary = useStore((s) => s.dashboardSummary);
  const dashboardLoading = useStore((s) => s.dashboardLoading);
  const loadDashboardData = useStore((s) => s.loadDashboardData);
  const language = useStore((s) => s.language);
  const { t } = useTranslation();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const isUrdu = language === 'ur';

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 60 seconds (FR-DASH-021)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => {
      loadDashboardData();
    }, 60000);
    return () => window.clearInterval(interval);
  }, [autoRefresh, loadDashboardData]);

  const handleNavigation = useCallback(
    (moduleName) => {
      notifications.show({
        title: t('common.noDataFound'),
        message: `${moduleName} module is not yet implemented.`,
        color: 'blue',
        autoClose: 3000,
      });
    },
    [t]
  );

  // Navigation button configuration — translated
  const adminButtons = [
    {
      label: t('dashboard.supplierBills'),
      icon: <IconFileInvoice size={18} />,
      key: 'supplier-bill',
      navigate: 'supplier-bills',
    },
    { label: t('nav.items'), icon: <IconPackage size={18} />, key: 'item', navigate: 'item' },
  ];

  const transactionButtons = [
    { label: t('nav.sales'), icon: <IconCash size={18} />, key: 'sale', navigate: 'sales' },
    {
      label: t('nav.purchases'),
      icon: <IconShoppingCart size={18} />,
      key: 'purchase',
      navigate: 'purchases',
    },
  ];

  const contactButtons = [
    {
      label: t('nav.customers'),
      icon: <IconUsers size={18} />,
      key: 'customers',
      navigate: 'customers',
    },
    {
      label: t('nav.suppliers'),
      icon: <IconTruck size={18} />,
      key: 'supplier',
      navigate: 'suppliers',
    },
  ];

  const reportButtons = [
    {
      label: t('report.customerLedger'),
      icon: <IconNotebook size={18} />,
      key: 'ledger',
      navigate: 'reports',
      tab: 'ledger',
    },
    {
      label: t('report.vendorSales'),
      icon: <IconChartBar size={18} />,
      key: 'vendor-sales',
      navigate: 'reports',
      tab: 'vendor-sales',
    },
    {
      label: isUrdu ? 'مال خریداری' : 'Item Purchase',
      icon: <IconReportAnalytics size={18} />,
      key: 'item-wise-purchase',
      navigate: 'reports',
      tab: 'item-purchase',
    },
    {
      label: t('report.stockReport'),
      icon: <IconTrendingUp size={18} />,
      key: 'stock-report',
      navigate: 'reports',
      tab: 'stock',
    },
    {
      label: isUrdu ? 'گاہک رجسٹر' : 'Customer Register',
      icon: <IconClipboardList size={18} />,
      key: 'customer-register',
      navigate: 'reports',
      tab: 'customer-register',
    },
    {
      label: isUrdu ? 'گاہک بکری' : 'Customer Recovery',
      icon: <IconReceipt size={18} />,
      key: 'client-sales',
      navigate: 'reports',
      tab: 'client-recovery',
    },
    {
      label: isUrdu ? 'روزانہ تفصیل' : 'Daily Details',
      icon: <IconCalendar size={18} />,
      key: 'daily-sales-details',
      navigate: 'reports',
      tab: 'daily-details',
    },
    {
      label: isUrdu ? 'روزانہ بکری' : 'Daily Sales',
      icon: <IconCalendarStats size={18} />,
      key: 'daily-sales',
      navigate: 'reports',
      tab: 'daily-sales',
    },
    {
      label: isUrdu ? 'مال بکری' : 'Item Sales',
      icon: <IconFish size={18} />,
      key: 'item-sale',
      navigate: 'reports',
      tab: 'item-sale',
    },
    {
      label: isUrdu ? 'رعایت' : 'Concessions',
      icon: <IconDiscount2 size={18} />,
      key: 'concession',
      navigate: 'reports',
      tab: 'concession',
    },
    {
      label: t('report.netSummary'),
      icon: <IconCoins size={18} />,
      key: 'net-summary',
      navigate: 'reports',
      tab: 'net-summary',
    },
  ];

  return (
    <Box style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* Header */}
      <Paper
        shadow="sm"
        style={{
          background: '#1e293b',
          borderRadius: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ padding: '16px 28px' }}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Stack gap={2}>
              <Group gap="xs" align="center">
                <ThemeIcon variant="filled" color="blue" size="md" radius="md">
                  <IconFish size={16} />
                </ThemeIcon>
                <Title order={3} c="white" style={{ letterSpacing: '-0.3px' }}>
                  AL-SHEIKH FISH TRADER
                </Title>
              </Group>
              <Text c="dimmed" size="xs" ms={42}>
                Shop No. W-644 Gunj Mandi Rawalpindi | +92-3008501724
              </Text>
            </Stack>

            <Group gap="sm" wrap="nowrap">
              {/* Quick Stats */}
              <StatCard
                value={dashboardSummary?.suppliers?.count || 0}
                label={t('dashboard.totalSuppliers')}
                icon={IconTruck}
                color="blue"
              />
              <StatCard
                value={dashboardSummary?.customers?.count || 0}
                label={t('dashboard.totalCustomers')}
                icon={IconUsers}
                color="violet"
              />
              <StatCard
                value={dashboardSummary?.items?.count || 0}
                label={t('nav.items')}
                icon={IconPackage}
                color="teal"
              />
              <StatCard
                value={dashboardSummary?.todaySales?.count || 0}
                label={isUrdu ? 'آج کی بکری' : "Today's Sales"}
                icon={IconCurrencyDollar}
                color="orange"
              />

              <Divider orientation="vertical" color="rgba(255,255,255,0.1)" />

              {/* Controls */}
              <Tooltip label={t('dashboard.autoRefresh')}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="md"
                  onClick={() => loadDashboardData()}
                  loading={dashboardLoading}
                >
                  <IconRefresh size={16} color="rgba(255,255,255,0.6)" />
                </ActionIcon>
              </Tooltip>
              <Tooltip
                label={autoRefresh ? t('dashboard.autoRefreshOn') : t('dashboard.autoRefreshOff')}
              >
                <ActionIcon
                  variant={autoRefresh ? 'filled' : 'subtle'}
                  color={autoRefresh ? 'teal' : 'gray'}
                  size="md"
                  onClick={() => setAutoRefresh((prev) => !prev)}
                >
                  <IconClock size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={isUrdu ? 'Switch to English' : 'اردو میں بدلیں'}>
                <Button
                  variant="subtle"
                  color="gray"
                  size="compact-sm"
                  leftSection={<IconWorld size={14} />}
                  onClick={onToggleLanguage}
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  {isUrdu ? 'English' : 'اردو'}
                </Button>
              </Tooltip>
            </Group>
          </Group>
        </div>
      </Paper>

      {/* Main Content */}
      <ScrollArea h="calc(100vh - 90px)" offsetScrollbars>
        <div style={{ padding: '20px 28px', display: 'flex', gap: '20px' }}>
          {/* Left Section - Navigation Buttons */}
          <div style={{ flex: '1 1 70%', minWidth: 0 }}>
            <Stack gap="md">
              {/* Row 1: Administration & Transactions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Administration */}
                <Card shadow="xs" padding="md" radius="md" style={{ background: '#ffffff' }}>
                  <SectionHeader
                    icon={IconFolder}
                    label={t('dashboard.administration')}
                    color="blue"
                  />
                  <Stack gap="xs">
                    {adminButtons.map((btn) => (
                      <DashboardButton
                        key={btn.key}
                        label={btn.label}
                        icon={btn.icon}
                        variant="administration"
                        onClick={() =>
                          btn.navigate
                            ? onNavigate?.(btn.navigate, { tab: btn.tab })
                            : handleNavigation(btn.label)
                        }
                      />
                    ))}
                  </Stack>
                </Card>

                {/* Transactions */}
                <Card shadow="xs" padding="md" radius="md" style={{ background: '#ffffff' }}>
                  <SectionHeader
                    icon={IconArrowsExchange}
                    label={t('dashboard.transactions')}
                    color="teal"
                  />
                  <Stack gap="xs">
                    {transactionButtons.map((btn) => (
                      <DashboardButton
                        key={btn.key}
                        label={btn.label}
                        icon={btn.icon}
                        variant="transaction"
                        onClick={() =>
                          btn.navigate ? onNavigate?.(btn.navigate) : handleNavigation(btn.label)
                        }
                      />
                    ))}
                  </Stack>
                </Card>
              </div>

              {/* Row 2: Contacts */}
              <Card shadow="xs" padding="md" radius="md" style={{ background: '#ffffff' }}>
                <SectionHeader
                  icon={IconAddressBook}
                  label={t('dashboard.contacts')}
                  color="violet"
                />
                <SimpleGrid cols={2} spacing="xs">
                  {contactButtons.map((btn) => (
                    <DashboardButton
                      key={btn.key}
                      label={btn.label}
                      icon={btn.icon}
                      variant="user"
                      onClick={() =>
                        btn.navigate ? onNavigate?.(btn.navigate) : handleNavigation(btn.label)
                      }
                    />
                  ))}
                </SimpleGrid>
              </Card>

              {/* Row 3: Reports */}
              <Card shadow="xs" padding="md" radius="md" style={{ background: '#ffffff' }}>
                <SectionHeader icon={IconChartBar} label={t('nav.reports')} color="orange" />
                <SimpleGrid cols={3} spacing="xs">
                  {reportButtons.map((btn) => (
                    <DashboardButton
                      key={btn.key}
                      label={btn.label}
                      icon={btn.icon}
                      variant="report"
                      onClick={() =>
                        btn.navigate
                          ? onNavigate?.(btn.navigate, { tab: btn.tab })
                          : handleNavigation(btn.label)
                      }
                    />
                  ))}
                </SimpleGrid>
              </Card>
            </Stack>
          </div>

          {/* Right Section - Information Panels */}
          <div style={{ flex: '0 0 320px', minWidth: '280px' }}>
            <Stack gap="md">
              {dashboardLoading ? (
                <Card
                  shadow="xs"
                  padding="xl"
                  radius="md"
                  h={400}
                  style={{ background: '#ffffff' }}
                >
                  <Center h="100%">
                    <Loader size="lg" />
                  </Center>
                </Card>
              ) : (
                <>
                  <SupplierAdvancesList data={supplierAdvances} loading={dashboardLoading} />
                  <ItemStockDisplay data={itemsStock} loading={dashboardLoading} />
                </>
              )}
            </Stack>
          </div>
        </div>
      </ScrollArea>
    </Box>
  );
}

Dashboard.propTypes = {
  onNavigate: PropTypes.func,
  onToggleLanguage: PropTypes.func,
};

export default Dashboard;
