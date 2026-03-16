import { Paper, Group, Title, Text, Button } from '@mantine/core';
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ItemForm, ItemSearch } from '../components';

/**
 * Items Page Component
 * Main container for item (fish type) management.
 * Implements FR-ITEM requirements.
 *
 * @param {function} onBack - Callback to navigate back to dashboard
 */
function Items({ onBack }) {
  const { t } = useTranslation();
  // Modal state
  const [formOpened, setFormOpened] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Open form for new item
  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setFormOpened(true);
  }, []);

  // Open form for editing
  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setFormOpened(true);
  }, []);

  // Close form
  const handleCloseForm = useCallback(() => {
    setFormOpened(false);
    setEditingItem(null);
  }, []);

  // Refresh list after save
  const handleSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-100 to-indigo-100 dark:from-gray-900 dark:to-slate-800">
      {/* Header */}
      <Paper
        shadow="md"
        className="bg-gradient-to-r from-blue-600 via-indigo-700 to-violet-800 flex-none"
        style={{ borderRadius: 0 }}
      >
        <div className="px-4 py-3">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Title order={3} c="white" className="font-bold m-0">
                📦 {t('item.title')}
              </Title>
              <Text c="white" opacity={0.9} size="sm">
                | {t('item.addNew')}
              </Text>
            </Group>
            <Group gap="sm">
              <Button
                size="sm"
                variant="white"
                color="indigo"
                onClick={handleAdd}
                leftSection={<span>➕</span>}
              >
                {t('item.addNew')}
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
        <ItemSearch onEdit={handleEdit} onRefresh={{ refreshKey }} />
      </div>

      {/* Item Form Modal */}
      <ItemForm
        opened={formOpened}
        onClose={handleCloseForm}
        item={editingItem}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

Items.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default Items;
