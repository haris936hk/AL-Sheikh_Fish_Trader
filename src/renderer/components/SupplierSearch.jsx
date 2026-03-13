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
  Pagination,
  Checkbox,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useState, useCallback, useEffect, useMemo } from 'react';

import { useResizableColumns } from '../hooks/useResizableColumns';
import useStore from '../store';
import { formatDisplayName } from '../utils/formatters';

/**
 * SupplierSearch Component
 * Search and list suppliers with edit/delete actions.
 * Implements FR-SUP-SEARCH-001 through FR-SUP-SEARCH-021.
 *
 * @param {function} onEdit - Callback when edit is clicked
 * @param {function} onRefresh - Callback to refresh after delete
 */
function SupplierSearch({ onEdit, onRefresh }) {
  const isUr = useStore((s) => s.language === 'ur');
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const t = useMemo(
    () => ({
      error: isUr ? 'خرابی' : 'Error',
      failedLoadData: isUr ? 'بیوپاری لوڈ کرنے میں ناکام' : 'Failed to load vendors',
      noResultsTitle: isUr ? 'کوئی نتیجہ نہیں' : 'No Results',
      noResultsMsg: isUr ? 'آپ کی تلاش کے مطابق کوئی بیوپاری نہیں ملا' : 'No vendors found matching your search',
      searchFailed: isUr ? 'تلاش ناکام ہو گئی' : 'Search failed',
      deleteTitle: isUr ? 'بیوپاری حذف کریں' : 'Delete Vendor',
      deleteBtn: isUr ? 'حذف کریں' : 'Delete',
      cancelBtn: isUr ? 'منسوخ' : 'Cancel',
      deletedTitle: isUr ? 'حذف ہو گیا' : 'Deleted',
      cannotDelete: isUr ? 'حذف نہیں کر سکتے' : 'Cannot Delete',
      failedDelete: isUr ? 'بیوپاری حذف کرنے میں ناکام' : 'Failed to delete vendor',
      searchPlaceholder: isUr ? 'نام سے تلاش کریں...' : 'Search by name...',
      searchBtn: isUr ? 'تلاش کریں' : '🔍 Search',
      clearBtn: isUr ? 'صاف کریں' : 'Clear',
      itemsFound: isUr ? 'بیوپاری ملے' : 'vendors found',
      itemFound: isUr ? 'بیوپاری ملا' : 'vendor found',
      noItemsText: isUr ? 'کوئی بیوپاری نہیں ملا' : 'No vendors found',
      colName: isUr ? 'نام' : 'Name',
      colCity: isUr ? 'شہر' : 'City',
      colCountry: isUr ? 'ملک' : 'Country',
      colContact: isUr ? 'رابطہ' : 'Contact',
      colAdvance: isUr ? 'پیشگی' : 'Advance',
      colActions: isUr ? 'عمل' : 'Actions',
      deleteConfirm1: isUr ? 'کیا آپ واقعی بیوپاری ' : 'Are you sure you want to delete vendor ',
      deleteConfirm2: isUr ? ' کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔' : '? This action cannot be undone.',
      deletedMsg1: isUr ? 'بیوپاری "' : 'Vendor "',
      deletedMsg2: isUr ? '" حذف ہو گیا ہے' : '" has been deleted',
      bulkDeleteTitle: isUr ? 'منتخب بیوپاری حذف کریں' : 'Delete Selected Vendors',
      bulkDeleteConfirm1: isUr ? 'کیا آپ واقعی ' : 'Are you sure you want to delete ',
      bulkDeleteConfirm2: isUr ? ' منتخب بیوپاری حذف کرنا چاہتے ہیں؟' : ' selected vendor(s)?',
      bulkDeleteBtn: isUr ? 'سب کو حذف کریں' : 'Delete All',
      bulkDeletedMsg: isUr ? ' بیوپاری حذف ہو گئے' : ' vendor(s) deleted',
      selectedText: isUr ? 'منتخب' : 'selected',
      deleteSelected: isUr ? 'منتخب حذف کریں' : '🗑️ Delete Selected',
      clearSelection: isUr ? 'چناؤ ختم کریں' : 'Clear Selection',
    }),
    [isUr]
  );

  // Bulk selection (FR-GRID-006)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Column resizing (FR-GRID-008)
  const { getResizeProps } = useResizableColumns({
    name: 200,
    city: 120,
    country: 120,
    contact: 150,
    advance: 100,
    actions: 100,
  });

  // Load all suppliers initially
  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.suppliers.getAll();
      if (result.success) {
        setSuppliers(result.data);
      } else {
        notifications.show({
          title: t.error,
          message: result.error || t.failedLoadData,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Load suppliers error:', error);
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
    loadSuppliers();
  }, [loadSuppliers]);

  // Search suppliers
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const result = searchTerm.trim()
        ? await window.api.suppliers.search(searchTerm)
        : await window.api.suppliers.getAll();

      if (result.success) {
        setSuppliers(result.data);
        setPage(1);
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
    (supplier) => {
      modals.openConfirmModal({
        title: t.deleteTitle,
        centered: true,
        children: (
          <Text size="sm">
            {t.deleteConfirm1}<strong>{formatDisplayName(supplier.name, supplier.name_english, isUr)}</strong>{t.deleteConfirm2}
          </Text>
        ),
        labels: { confirm: t.deleteBtn, cancel: t.cancelBtn },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          try {
            const result = await window.api.suppliers.delete(supplier.id);
            if (result.success) {
              notifications.show({
                title: t.deletedTitle,
                message: `${t.deletedMsg1}${formatDisplayName(supplier.name, supplier.name_english, isUr)}${t.deletedMsg2}`,
                color: 'green',
              });
              loadSuppliers();
              onRefresh?.();
            } else {
              notifications.show({
                title: t.cannotDelete,
                message: result.error,
                color: 'red',
              });
            }
          } catch {
            notifications.show({
              title: t.error,
              message: t.failedDelete,
              color: 'red',
            });
          }
        },
      });
    },
    [loadSuppliers, onRefresh, isUr, t]
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
      loadSuppliers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh?.refreshKey]);

  // Paginated rows
  const totalPages = Math.ceil(suppliers.length / PAGE_SIZE);
  const paginatedSuppliers = suppliers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Table rows
  const rows = paginatedSuppliers.map((supplier) => (
    <Table.Tr key={supplier.id} bg={selectedIds.has(supplier.id) ? 'blue.0' : undefined}>
      <Table.Td>
        <Checkbox
          checked={selectedIds.has(supplier.id)}
          onChange={(e) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              e.target.checked ? next.add(supplier.id) : next.delete(supplier.id);
              return next;
            });
          }}
        />
      </Table.Td>
      <Table.Td>
        <Text fw={500} dir={isUr ? 'rtl' : 'ltr'}>
          {formatDisplayName(supplier.name, supplier.name_english, isUr)}
        </Text>
      </Table.Td>
      <Table.Td>{supplier.city_name || '-'}</Table.Td>
      <Table.Td>{supplier.country_name || '-'}</Table.Td>
      <Table.Td>{supplier.mobile || supplier.phone || supplier.email || '-'}</Table.Td>
      <Table.Td>
        <Badge variant="light" color="blue">
          {Number(supplier.advance_amount || 0).toFixed(2)}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Edit">
            <ActionIcon variant="light" color="blue" onClick={() => onEdit?.(supplier)}>
              <span>✏️</span>
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="light" color="red" onClick={() => handleDelete(supplier)}>
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
                loadSuppliers();
              }}
            >
              {t.clearBtn}
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            {suppliers.length} {suppliers.length !== 1 ? t.itemsFound : t.itemFound}
          </Text>
        </Group>

        {/* Bulk Actions (FR-GRID-006) */}
        {selectedIds.size > 0 && (
          <Group
            gap="sm"
            p="xs"
            style={{ background: 'var(--mantine-color-blue-0)', borderRadius: 8 }}
          >
            <Text size="sm" fw={500}>
              {selectedIds.size} {t.selectedText}
            </Text>
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() => {
                modals.openConfirmModal({
                  title: t.bulkDeleteTitle,
                  children: (
                    <Text size="sm">
                      {t.bulkDeleteConfirm1}{selectedIds.size}{t.bulkDeleteConfirm2}
                    </Text>
                  ),
                  labels: { confirm: t.bulkDeleteBtn, cancel: t.cancelBtn },
                  confirmProps: { color: 'red' },
                  onConfirm: async () => {
                    for (const id of selectedIds) {
                      await window.api.suppliers.delete(id);
                    }
                    setSelectedIds(new Set());
                    loadSuppliers();
                    notifications.show({
                      title: t.deletedTitle,
                      message: `${selectedIds.size}${t.bulkDeletedMsg}`,
                      color: 'green',
                    });
                  },
                });
              }}
            >
              {t.deleteSelected}
            </Button>
            <Button size="xs" variant="subtle" onClick={() => setSelectedIds(new Set())}>
              {t.clearSelection}
            </Button>
          </Group>
        )}

        {/* Results Table */}
        <ScrollArea h={400}>
          {loading && initialLoad ? (
            <Center h={300}>
              <Loader size="lg" />
            </Center>
          ) : suppliers.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <Text size="xl">📭</Text>
                <Text c="dimmed">{t.noItemsText}</Text>
              </Stack>
            </Center>
          ) : (
            <Table striped highlightOnHover style={{ tableLayout: 'fixed' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }}>
                    <Checkbox
                      checked={
                        paginatedSuppliers.length > 0 &&
                        paginatedSuppliers.every((s) => selectedIds.has(s.id))
                      }
                      indeterminate={
                        paginatedSuppliers.some((s) => selectedIds.has(s.id)) &&
                        !paginatedSuppliers.every((s) => selectedIds.has(s.id))
                      }
                      onChange={(e) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          paginatedSuppliers.forEach((s) =>
                            e.target.checked ? next.add(s.id) : next.delete(s.id)
                          );
                          return next;
                        });
                      }}
                    />
                  </Table.Th>
                  {[
                    ['name', t.colName],
                    ['city', t.colCity],
                    ['country', t.colCountry],
                    ['contact', t.colContact],
                    ['advance', t.colAdvance],
                    ['actions', t.colActions],
                  ].map(([key, label]) => {
                    const rp = getResizeProps(key);
                    return (
                      <Table.Th key={key} style={rp.style}>
                        {label}
                        <div {...rp.resizeHandle} />
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="center" mt="sm">
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
          </Group>
        )}
      </Stack>
    </Card>
  );
}

SupplierSearch.propTypes = {
  onEdit: PropTypes.func,
  onRefresh: PropTypes.object,
};

export default SupplierSearch;
