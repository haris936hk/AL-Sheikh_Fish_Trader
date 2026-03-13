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
import { useState, useCallback, useEffect, useMemo } from 'react';

import useStore from '../store';
import { formatDisplayName } from '../utils/formatters';

/**
 * ItemSearch Component
 * Search and list items with edit/delete actions.
 * Implements item management requirements from FR-ITEM section.
 *
 * @param {function} onEdit - Callback when edit is clicked
 * @param {function} onRefresh - Callback to refresh after delete
 */
function ItemSearch({ onEdit, onRefresh }) {
  const isUr = useStore((s) => s.language === 'ur');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const t = useMemo(
    () => ({
      error: isUr ? 'خرابی' : 'Error',
      failedLoadData: isUr ? 'آئٹمز لوڈ کرنے میں ناکام' : 'Failed to load items',
      noResultsTitle: isUr ? 'کوئی نتیجہ نہیں' : 'No Results',
      noResultsMsg: isUr ? 'آپ کی تلاش کے مطابق کوئی آئٹم نہیں ملا' : 'No items found matching your search',
      searchFailed: isUr ? 'تلاش ناکام ہو گئی' : 'Search failed',
      deleteTitle: isUr ? 'آئٹم حذف کریں' : 'Delete Item',
      deleteBtn: isUr ? 'حذف کریں' : 'Delete',
      cancelBtn: isUr ? 'منسوخ' : 'Cancel',
      deletedTitle: isUr ? 'حذف ہو گیا' : 'Deleted',
      cannotDelete: isUr ? 'حذف نہیں کر سکتے' : 'Cannot Delete',
      failedDelete: isUr ? 'آئٹم حذف کرنے میں ناکام' : 'Failed to delete item',
      searchPlaceholder: isUr ? 'نام سے تلاش کریں...' : 'Search by item name...',
      searchBtn: isUr ? 'تلاش کریں' : '🔍 Search',
      clearBtn: isUr ? 'صاف کریں' : 'Clear',
      itemsFound: isUr ? 'آئٹمز ملے' : 'items found',
      itemFound: isUr ? 'آئٹم ملا' : 'item found',
      noItemsText: isUr ? 'کوئی آئٹم نہیں ملا' : 'No items found',
      colName: isUr ? 'نام' : 'Name',
      colCategory: isUr ? 'قسم' : 'Category',
      colUnitPrice: isUr ? 'قیمت' : 'Unit Price',
      colStock: isUr ? 'اسٹاک' : 'Stock',
      colActions: isUr ? 'عمل' : 'Actions',
      deleteConfirm1: isUr ? 'کیا آپ واقعی آئٹم ' : 'Are you sure you want to delete item ',
      deleteConfirm2: isUr ? ' کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔' : '? This action cannot be undone.',
      deletedMsg1: isUr ? 'آئٹم "' : 'Item "',
      deletedMsg2: isUr ? '" حذف ہو گیا ہے' : '" has been deleted',
    }),
    [isUr]
  );

  // Load all items initially
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.items.getAll();
      if (result.success) {
        setItems(result.data);
      } else {
        notifications.show({
          title: t.error,
          message: result.error || t.failedLoadData,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Load items error:', error);
      notifications.show({
        title: t.error,
        message: t.failedLoadData,
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
            title: t.noResultsTitle,
            message: t.noResultsMsg,
            color: 'blue',
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      notifications.show({
        title: t.error,
        message: t.searchFailed,
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
        title: t.deleteTitle,
        centered: true,
        children: (
          <Text size="sm">
            {t.deleteConfirm1}<strong>{formatDisplayName(item.name, item.name_english, isUr)}</strong>{t.deleteConfirm2}
          </Text>
        ),
        labels: { confirm: t.deleteBtn, cancel: t.cancelBtn },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          try {
            const result = await window.api.items.delete(item.id);
            if (result.success) {
              notifications.show({
                title: t.deletedTitle,
                message: `${t.deletedMsg1}${formatDisplayName(item.name, item.name_english, isUr)}${t.deletedMsg2}`,
                color: 'green',
              });
              loadItems();
              onRefresh?.();
            } else {
              notifications.show({
                title: t.cannotDelete,
                message: result.error,
                color: 'red',
              });
            }
          } catch (error) {
            console.error('Delete item error:', error);
            notifications.show({
              title: t.error,
              message: t.failedDelete,
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
      <Table.Td>{item.category_name || item.category_name_urdu || 'None'}</Table.Td>
      <Table.Td>
        <Badge variant="light" color="green">
          Rs. {Math.round(Number(item.unit_price || 0)).toLocaleString('en-US')}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color="blue">
          {Number(item.current_stock || 0).toFixed(2)} kg
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Edit">
            <ActionIcon variant="light" color="blue" onClick={() => onEdit?.(item)}>
              <span>✏️</span>
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="light" color="red" onClick={() => handleDelete(item)}>
              <span>🗑️</span>
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Search Section */}
        <Group justify="space-between">
          <Group>
            <TextInput
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ width: 300, direction: isUr ? 'rtl' : 'ltr' }}
            />
            <Button onClick={handleSearch} loading={loading}>
              {t.searchBtn}
            </Button>
            <Button
              variant="light"
              onClick={() => {
                setSearchTerm('');
                loadItems();
              }}
            >
              {t.clearBtn}
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            {items.length} {items.length !== 1 ? t.itemsFound : t.itemFound}
          </Text>
        </Group>

        {/* Results Table */}
        <ScrollArea h={400}>
          {loading && initialLoad ? (
            <Center h={300}>
              <Loader size="lg" />
            </Center>
          ) : items.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <Text size="xl">📭</Text>
                <Text c="dimmed">{t.noItemsText}</Text>
              </Stack>
            </Center>
          ) : (
            <Table striped highlightOnHover style={{ direction: isUr ? 'rtl' : 'ltr' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.colName}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.colCategory}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.colUnitPrice}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'left' : 'right' }}>{t.colStock}</Table.Th>
                  <Table.Th style={{ textAlign: isUr ? 'right' : 'left' }}>{t.colActions}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </Stack>
    </Card>
  );
}

ItemSearch.propTypes = {
  onEdit: PropTypes.func,
  onRefresh: PropTypes.object,
};

export default ItemSearch;
