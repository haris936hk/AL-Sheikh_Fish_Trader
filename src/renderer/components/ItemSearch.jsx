import {
  Card,
  TextInput,
  Button,
  Group,
  Table,
  Text,
  ActionIcon,
  Tooltip,
  Stack,
  Center,
  Loader,
  Badge,
  ScrollArea,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '../store';
import { formatDisplayName } from '../utils/formatters';

/**
 * ItemSearch Component
 * Search and list items with edit/delete actions.
 * Implements item management requirements from FR-ITEM section.
 *
 * @param {function} onEdit - Callback when edit is clicked
 * @param {function} onRefresh - Callback to refresh after delete
 * @param {function} onAdd - Callback when add is clicked
 */
function ItemSearch({ onEdit, onRefresh, onAdd }) {
  const isUr = useStore((s) => s.language === 'ur');
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Load all items initially
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.items.getAll();
      if (result.success) {
        setItems(result.data);
      } else {
        notifications.show({
          title: t('error.title', 'Error'),
          message: result.error || t('itemSearch.failedLoadData', 'Failed to load items'),
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Load items error:', error);
      notifications.show({
        title: t('error.title'),
        message: t('itemSearch.failedLoadData'),
        color: 'red',
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [t]);

  // Load on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Search items
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const result = searchTerm.trim()
        ? await window.api.items.search(searchTerm)
        : await window.api.items.getAll();

      if (result.success) {
        setItems(result.data);
        if (result.data.length === 0) {
          notifications.show({
            title: t('search.noResultsTitle'),
            message: t('itemSearch.noResultsMsg'),
            color: 'blue',
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      notifications.show({
        title: t('error.title'),
        message: t('search.searchFailed'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, t]);

  // Handle delete with confirmation
  const handleDelete = useCallback(
    (item) => {
      modals.openConfirmModal({
        title: t('itemSearch.deleteTitle'),
        centered: true,
        children: (
          <Text size="sm">
            {t('itemSearch.deleteConfirm1')}<strong>{formatDisplayName(item.name, item.name_english, isUr)}</strong>{t('itemSearch.deleteConfirm2')}
          </Text>
        ),
        labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          try {
            const result = await window.api.items.delete(item.id);
            if (result.success) {
              notifications.show({
                title: t('app.deleted'),
                message: `${t('itemSearch.deletedMsg1')}${formatDisplayName(item.name, item.name_english, isUr)}${t('itemSearch.deletedMsg2')}`,
                color: 'green',
              });
              loadItems();
              onRefresh?.();
            } else {
              notifications.show({
                title: t('app.cannotDelete'),
                message: result.error,
                color: 'red',
              });
            }
          } catch (error) {
            console.error('Delete item error:', error);
            notifications.show({
              title: t('error.title'),
              message: t('itemSearch.failedDelete'),
              color: 'red',
            });
          }
        },
      });
    },
    [loadItems, onRefresh, isUr, t]
  );

  // Handle key press in search input
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  // Refresh when parent requests
  useEffect(() => {
    if (!initialLoad) {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh?.refreshKey]);

  // Table rows
  const rows = items.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        <Text fw={500} dir={isUr ? 'rtl' : 'ltr'}>
          {formatDisplayName(item.name, item.name_english, isUr)}
        </Text>
      </Table.Td>
      <Table.Td>{item.category_name || item.category_name_urdu || t('common.none')}</Table.Td>
      <Table.Td>
        <Badge variant="light" color="green">
          {Math.round(Number(item.unit_price || 0)).toLocaleString('en-US')}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color="blue">
          {Number(item.current_stock || 0).toFixed(2)} {t('common.kg')}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label={t('app.edit')}>
            <ActionIcon variant="light" color="blue" onClick={() => onEdit?.(item)}>
              <span>✏️</span>
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('app.delete')}>
            <ActionIcon variant="light" color="red" onClick={() => handleDelete(item)}>
              <span>🗑️</span>
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Card shadow="sm" padding="sm" radius="md" withBorder className="h-full flex flex-col overflow-hidden" pos="relative">
      <div className="flex-none flex flex-col gap-3">
        {/* Search Section */}
        <Group justify="space-between">
          <Group>
            <TextInput
              placeholder={t('itemSearch.searchPlaceholder', 'Search by item name...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ width: 300, direction: isUr ? 'rtl' : 'ltr' }}
            />
            <Button onClick={handleSearch} loading={loading}>
              {t('itemSearch.searchBtn', '🔍 Search')}
            </Button>
            <Button
              variant="light"
              onClick={() => {
                setSearchTerm('');
                loadItems();
              }}
            >
              {t('app.clear', 'Clear')}
            </Button>
            {onAdd && (
              <Button
                variant="light"
                color="indigo"
                onClick={onAdd}
                leftSection={<span>➕</span>}
              >
                {t('item.addNew')}
              </Button>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {items.length} {items.length !== 1 ? t('itemSearch.itemsFound') : t('itemSearch.itemFound')}
          </Text>
        </Group>
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-hidden min-h-0 mt-3 relative border border-gray-200 dark:border-gray-700 rounded-md">
        <ScrollArea className="h-full">
          {loading && initialLoad ? (
            <Center h={300}>
              <Loader size="lg" />
            </Center>
          ) : items.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <Text size="xl">📭</Text>
                <Text c="dimmed">{t('itemSearch.noItemsText', 'No items found')}</Text>
              </Stack>
            </Center>
          ) : (
            <Table striped highlightOnHover style={{ direction: isUr ? 'rtl' : 'ltr' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t('common.name', 'Name')}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t('common.category', 'Category')}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t('itemSearch.colUnitPrice', 'Unit Price')}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t('itemSearch.colStock', 'Stock')}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t('common.actions', 'Actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </div>
    </Card>
  );
}

ItemSearch.propTypes = {
  onEdit: PropTypes.func,
  onRefresh: PropTypes.object,
  onAdd: PropTypes.func,
};

export default ItemSearch;
