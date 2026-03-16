import { Box, Group, Title, Button, Tabs } from '@mantine/core';
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SaleForm, SaleSearch } from '../components';

/**
 * Sales Page Component
 * Container for Sales module with tabs for new sale entry and search.
 *
 * @param {function} onBack - Callback to navigate back to dashboard
 */
function Sales({ onBack }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('new');
  const [editSale, setEditSale] = useState(null);

  // Handle sale saved
  const handleSaleSaved = useCallback(() => {
    setEditSale(null);
    setActiveTab('search');
  }, []);

  // Handle edit from search
  const handleEdit = useCallback(async (sale) => {
    try {
      const response = await window.api.sales.getById(sale.id);
      if (response.success) {
        setEditSale(response.data);
        setActiveTab('new');
      }
    } catch (error) {
      console.error('Failed to load sale:', error);
    }
  }, []);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditSale(null);
  }, []);

  return (
    <Box
      className="h-full flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1a365d 0%, #2d3748 50%, #1a202c 100%)',
      }}
    >
      <div className="flex-none p-4 pb-2">
        {/* Header */}
        <Group justify="space-between" align="center" mb="sm">
          <Title order={3} c="white">
            💰 {t('sale.title')}
          </Title>
          <Button variant="light" color="gray" size="sm" onClick={onBack}>
            ← {t('nav.dashboard')}
          </Button>
        </Group>
      </div>

      <div className="flex-1 overflow-hidden px-4 pb-4">
        <Tabs value={activeTab} onChange={setActiveTab} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Tabs.List mb="sm" style={{ flex: 'none' }}>
            <Tabs.Tab value="new" color="blue">
              {editSale ? t('sale.edit') : t('sale.addNew')}
            </Tabs.Tab>
            <Tabs.Tab value="search" color="teal">
              {t('saleSearch.title')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="new" style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
            <SaleForm
              editSale={editSale}
              onSaved={handleSaleSaved}
              onCancel={editSale ? handleCancelEdit : null}
            />
          </Tabs.Panel>

          <Tabs.Panel value="search" style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
            <SaleSearch onEdit={handleEdit} />
          </Tabs.Panel>
        </Tabs>
      </div>
    </Box>
  );
}

Sales.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default Sales;
