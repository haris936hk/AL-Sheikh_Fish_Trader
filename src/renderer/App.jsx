import { MantineProvider, Group, Button, Text, Tooltip, LoadingOverlay, DirectionProvider, useDirection } from '@mantine/core';
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
import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { ErrorBoundary } from './components';
import i18n from './i18n/index.js';
import Dashboard from './pages/Dashboard';
import useStore from './store';

// Lazy-loaded pages — only loaded when navigated to
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Customers = lazy(() => import('./pages/Customers'));
const SupplierBills = lazy(() => import('./pages/SupplierBills'));
const Items = lazy(() => import('./pages/Items'));
const Sales = lazy(() => import('./pages/Sales'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Reports = lazy(() => import('./pages/Reports'));

/**
 * Root App Component
 * Provides theme context and handles page navigation.
 * Supports Urdu (RTL) and English (LTR) languages via react-i18next.
 */
function App() {
  const theme = useStore((s) => s.theme);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const loadSettings = useStore((s) => s.loadSettings);
  const saveSetting = useStore((s) => s.saveSetting);
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [reportTab, setReportTab] = useState(null);

  // Load settings from DB on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Sync language changes → i18n and direction
  useEffect(() => {
    i18n.changeLanguage(language);
    // document elements are updated in i18n/index.js listener, but we use useDirection here if possible
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
      dashboard: `FISHPLUS - ${t('nav.dashboard')}`,
      suppliers: `FISHPLUS - ${t('nav.suppliers')}`,
      customers: `FISHPLUS - ${t('nav.customers')}`,
      'supplier-bills': `FISHPLUS - ${t('nav.bills')}`,
      item: `FISHPLUS - ${t('nav.items')}`,
      sales: `FISHPLUS - ${t('nav.sales')}`,
      purchases: `FISHPLUS - ${t('nav.purchases')}`,
      reports: `FISHPLUS - ${t('nav.reports')}`,
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
    let pageContent = null;
    switch (currentPage) {
      case 'suppliers':
        pageContent = <Suppliers onBack={() => navigateTo('dashboard')} />;
        break;
      case 'customers':
        pageContent = <Customers onBack={() => navigateTo('dashboard')} />;
        break;
      case 'supplier-bills':
        pageContent = <SupplierBills onBack={() => navigateTo('dashboard')} />;
        break;
      case 'item':
        pageContent = <Items onBack={() => navigateTo('dashboard')} />;
        break;
      case 'sales':
        pageContent = <Sales onBack={() => navigateTo('dashboard')} />;
        break;
      case 'purchases':
        pageContent = <Purchases onBack={() => navigateTo('dashboard')} />;
        break;
      case 'reports':
        pageContent = <Reports onBack={() => navigateTo('dashboard')} initialTab={reportTab} />;
        break;
      default:
        pageContent = <Dashboard onNavigate={navigateTo} onToggleLanguage={toggleLanguage} />;
        break;
    }

    // Wrap the individual page in an ErrorBoundary so a crash doesn't break navigation
    return <ErrorBoundary key={currentPage}>{pageContent}</ErrorBoundary>;
  };

  // Suspense fallback for lazy-loaded pages
  const pageFallback = <LoadingOverlay visible loaderProps={{ type: 'dots' }} />;

  return (
    <MantineProvider
      theme={{
        colorScheme: theme,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Noto Sans Arabic'",
        primaryColor: 'blue',
      }}
    >
      {/* RTL-aware notification position: top-right for LTR (en), top-left for RTL (ur).
           Mantine v8 removed top-start/top-end; use explicit left/right instead. */}
      <Notifications position={language === 'ur' ? 'top-left' : 'top-right'} />
      <ModalsProvider>
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
          <Suspense fallback={pageFallback}>{renderPage()}</Suspense>
        </ErrorBoundary>
      </ModalsProvider>
    </MantineProvider>
  );
}

// Wrap with DirectionProvider and an inner component to access useDirection
function AppWrapper() {
  return (
    <DirectionProvider detectDirection>
      <AppInner />
    </DirectionProvider>
  );
}

function AppInner() {
  const language = useStore((s) => s.language);
  const { setDirection } = useDirection();

  useEffect(() => {
    setDirection(language === 'ur' ? 'rtl' : 'ltr');
  }, [language, setDirection]);

  return <App />;
}

export default AppWrapper;
