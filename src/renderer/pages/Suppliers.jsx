import { Paper, Group, Title, Text, Button } from '@mantine/core';
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SupplierForm, SupplierSearch } from '../components';

/**
 * Suppliers Page Component
 * Main container for supplier management.
 * Implements FR-SUP requirements and FR-SUP-SEARCH requirements.
 *
 * @param {function} onBack - Callback to navigate back to dashboard
 */
function Suppliers({ onBack }) {
  const { t } = useTranslation();
  // Modal state
  const [formOpened, setFormOpened] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Open form for new supplier
  const handleAdd = useCallback(() => {
    setEditingSupplier(null);
    setFormOpened(true);
  }, []);

  // Open form for editing
  const handleEdit = useCallback((supplier) => {
    setEditingSupplier(supplier);
    setFormOpened(true);
  }, []);

  // Close form
  const handleCloseForm = useCallback(() => {
    setFormOpened(false);
    setEditingSupplier(null);
  }, []);

  // Refresh list after save
  const handleSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-100 to-green-100 dark:from-gray-900 dark:to-slate-800">
      {/* Header */}
      <Paper
        shadow="md"
        className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 flex-none"
        style={{ borderRadius: 0 }}
      >
        <div className="px-4 py-3">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Title order={3} c="white" className="font-bold m-0">
                🚚 {t('supplier.title')}
              </Title>
              <Text c="white" opacity={0.9} size="sm">
                | {t('supplier.addNew')}
              </Text>
            </Group>
            <Group gap="sm">
              <Button
                size="sm"
                variant="white"
                color="teal"
                onClick={handleAdd}
                leftSection={<span>➕</span>}
              >
                {t('supplier.addNew')}
              </Button>
              <Button size="sm" variant="light" color="gray" onClick={onBack} leftSection={<span>🏠</span>}>
                {t('nav.dashboard')}
              </Button>
            </Group>
          </Group>
        </div>
      </Paper>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-3 relative">
        <SupplierSearch onEdit={handleEdit} onRefresh={{ refreshKey }} />
      </div>

      {/* Supplier Form Modal */}
      <SupplierForm
        opened={formOpened}
        onClose={handleCloseForm}
        supplier={editingSupplier}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

Suppliers.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default Suppliers;
