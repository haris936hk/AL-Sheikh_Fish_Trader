import { MantineProvider, Group, Button, Text, Tooltip } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import {
  IconHome,
  IconCash,
  IconShoppingCart,
  IconUsers,
  IconTruck,
  IconPackage,
  IconFileInvoice,
  IconChartBar,
  IconWorld,
  IconFish,
} from '@tabler/icons-react';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { ErrorBoundary } from './components';
import i18n from './i18n/index.js';
import {
  Dashboard,
  Suppliers,
  Customers,
  SupplierBills,
  Items,
  Sales,
  Purchases,
  Reports,
} from './pages';
import useStore from './store';

/**
 * Root App Component
 * Provides theme context and handles page navigation.
 * Supports Urdu (RTL) and English (LTR) languages via react-i18next.
 */
function App() {
  const { theme, language, setLanguage, loadSettings, saveSetting } = useStore();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [reportTab, setReportTab] = useState(null);

  // Load settings from DB on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Sync language changes → i18n only (layout stays LTR always)
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // Language toggle
  const toggleLanguage = useCallback(async () => {
    const newLang = language === 'ur' ? 'en' : 'ur';
    setLanguage(newLang);
    await saveSetting('app_language', newLang);
  }, [language, setLanguage, saveSetting]);

  // Menu items — translated labels built dynamically inside component
  const menuItems = [
    { key: 'dashboard', labelKey: 'nav.dashboard', icon: IconHome, shortcut: 'Ctrl+1' },
    { key: 'sales', labelKey: 'nav.sales', icon: IconCash, shortcut: 'Ctrl+2' },
    { key: 'purchases', labelKey: 'nav.purchases', icon: IconShoppingCart, shortcut: 'Ctrl+3' },
    { key: 'customers', labelKey: 'nav.customers', icon: IconUsers, shortcut: 'Ctrl+4' },
    { key: 'suppliers', labelKey: 'nav.suppliers', icon: IconTruck, shortcut: 'Ctrl+5' },
    { key: 'item', labelKey: 'nav.items', icon: IconPackage, shortcut: 'Ctrl+6' },
    { key: 'supplier-bills', labelKey: 'nav.bills', icon: IconFileInvoice, shortcut: 'Ctrl+7' },
    { key: 'reports', labelKey: 'nav.reports', icon: IconChartBar, shortcut: 'Ctrl+8' },
  ];

  // Dynamic window title
  useEffect(() => {
    const pageTitles = {
      dashboard: `FISHPLUS - ${  t('nav.dashboard')}`,
      suppliers: `FISHPLUS - ${  t('nav.suppliers')}`,
      customers: `FISHPLUS - ${  t('nav.customers')}`,
      'supplier-bills': `FISHPLUS - ${  t('nav.bills')}`,
      item: `FISHPLUS - ${  t('nav.items')}`,
      sales: `FISHPLUS - ${  t('nav.sales')}`,
      purchases: `FISHPLUS - ${  t('nav.purchases')}`,
      reports: `FISHPLUS - ${  t('nav.reports')}`,
    };
    document.title = pageTitles[currentPage] || 'FISHPLUS Distributor';
  }, [currentPage, t]);

  // Navigation handler
  const navigateTo = useCallback((page, data = {}) => {
    setCurrentPage(page);
    if (data.tab) {
      setReportTab(data.tab);
    } else {
      setReportTab(null);
    }
  }, []);

  // Keyboard shortcuts (FR-NAV-006)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            navigateTo('dashboard');
            break;
          case '2':
            e.preventDefault();
            navigateTo('sales');
            break;
          case '3':
            e.preventDefault();
            navigateTo('purchases');
            break;
          case '4':
            e.preventDefault();
            navigateTo('customers');
            break;
          case '5':
            e.preventDefault();
            navigateTo('suppliers');
            break;
          case '6':
            e.preventDefault();
            navigateTo('item');
            break;
          case '7':
            e.preventDefault();
            navigateTo('supplier-bills');
            break;
          case '8':
            e.preventDefault();
            navigateTo('reports');
            break;
          default:
            break;
        }
      }

      if (e.key === 'Escape' && currentPage !== 'dashboard') {
        e.preventDefault();
        navigateTo('dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateTo, currentPage]);

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'suppliers':
        return <Suppliers onBack={() => navigateTo('dashboard')} />;
      case 'customers':
        return <Customers onBack={() => navigateTo('dashboard')} />;
      case 'supplier-bills':
        return <SupplierBills onBack={() => navigateTo('dashboard')} />;
      case 'item':
        return <Items onBack={() => navigateTo('dashboard')} />;
      case 'sales':
        return <Sales onBack={() => navigateTo('dashboard')} />;
      case 'purchases':
        return <Purchases onBack={() => navigateTo('dashboard')} />;
      case 'reports':
        return <Reports onBack={() => navigateTo('dashboard')} initialTab={reportTab} />;
      default:
        return <Dashboard onNavigate={navigateTo} onToggleLanguage={toggleLanguage} />;
    }
  };

  return (
    <MantineProvider
      theme={{
        colorScheme: theme,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        primaryColor: 'blue',
      }}
    >
      <ModalsProvider>
        <Notifications position="top-right" />
        <ErrorBoundary>
          {/* Menu Bar - visible on all non-dashboard pages (FR-MENU-001) */}
          {currentPage !== 'dashboard' && (
            <div
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                padding: '6px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
              }}
            >
              <Group gap="xs" justify="space-between">
                <Group gap={4}>
                  <Text
                    fw={700}
                    size="sm"
                    style={{
                      color: '#38bdf8',
                      letterSpacing: '0.5px',
                      marginInlineEnd: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => navigateTo('dashboard')}
                  >
                    <Group gap={4} align="center" wrap="nowrap">
                      <IconFish size={14} />
                      FISHPLUS
                    </Group>
                  </Text>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.key;
                    return (
                      <Tooltip
                        key={item.key}
                        label={`${t(item.labelKey)} (${item.shortcut})`}
                        position="bottom"
                        withArrow
                      >
                        <Button
                          size="compact-xs"
                          variant={isActive ? 'filled' : 'subtle'}
                          color={isActive ? 'blue' : 'gray'}
                          leftSection={<Icon size={14} />}
                          onClick={() => navigateTo(item.key)}
                          style={{
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                            fontWeight: isActive ? 600 : 400,
                            fontSize: '12px',
                          }}
                        >
                          {t(item.labelKey)}
                        </Button>
                      </Tooltip>
                    );
                  })}
                </Group>
                <Group gap="xs">
                  <Tooltip
                    label={language === 'ur' ? 'Switch to English' : 'اردو میں بدلیں'}
                    position="bottom"
                  >
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      leftSection={<IconWorld size={14} />}
                      onClick={toggleLanguage}
                      style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}
                    >
                      {language === 'ur' ? 'English' : 'اردو'}
                    </Button>
                  </Tooltip>
                  <Text size="xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Esc = {t('nav.dashboard')}
                  </Text>
                </Group>
              </Group>
            </div>
          )}
          {renderPage()}
        </ErrorBoundary>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
