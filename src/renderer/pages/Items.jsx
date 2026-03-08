import { Title, Text, Button, Group, Stack, Paper } from '@mantine/core';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-green-100 dark:from-gray-900 dark:to-slate-800">
      {/* Header */}
      <Paper
        shadow="md"
        className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800"
        style={{ borderRadius: 0 }}
      >
        <div className="px-8 py-6">
          <Group justify="space-between" align="center">
            <Stack gap={4}>
              <Title order={1} c="white" className="text-3xl font-bold">
                📦 {t('item.title')}
              </Title>
              <Text c="white" opacity={0.9} size="md">
                {t('item.addNew')}
              </Text>
            </Stack>
            <Group>
              <Button
                variant="white"
                color="teal"
                onClick={handleAdd}
                leftSection={<span>➕</span>}
              >
                {t('item.addNew')}
              </Button>
              <Button variant="light" color="gray" onClick={onBack} leftSection={<span>🏠</span>}>
                {t('nav.dashboard')}
              </Button>
            </Group>
          </Group>
        </div>
      </Paper>

      {/* Main Content */}
      <div className="p-8">
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
