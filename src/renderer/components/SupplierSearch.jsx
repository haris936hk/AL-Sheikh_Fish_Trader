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
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

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
          title: t('error.title'),
          message: result.error || t('supplierSearch.failedLoadData'),
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Load suppliers error:', error);
      notifications.show({
        title: t('error.title'),
        message: t('supplierSearch.failedLoadData'),
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
            title: t('search.noResultsTitle'),
            message: t('supplierSearch.noResultsMsg'),
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
    (supplier) => {
      modals.openConfirmModal({
        title: t('supplierSearch.deleteTitle'),
        centered: true,
        children: (
          <Text size="sm">
            {t('supplierSearch.deleteConfirm1')}<strong>{formatDisplayName(supplier.name, supplier.name_english, isUr)}</strong>{t('supplierSearch.deleteConfirm2')}
          </Text>
        ),
        labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          try {
            const result = await window.api.suppliers.delete(supplier.id);
            if (result.success) {
              notifications.show({
                title: t('app.deleted'),
                message: `${t('supplierSearch.deletedMsg1')}${formatDisplayName(supplier.name, supplier.name_english, isUr)}${t('supplierSearch.deletedMsg2')}`,
                color: 'green',
              });
              loadSuppliers();
              onRefresh?.();
            } else {
              notifications.show({
                title: t('app.cannotDelete'),
                message: result.error,
                color: 'red',
              });
            }
          } catch {
            notifications.show({
              title: t('error.title'),
              message: t('supplierSearch.failedDelete'),
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
          {Math.round(Number(supplier.advance_amount || 0)).toLocaleString('en-US')}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label={t('app.edit')}>
            <ActionIcon variant="light" color="blue" onClick={() => onEdit?.(supplier)}>
              <span>✏️</span>
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('app.delete')}>
            <ActionIcon variant="light" color="red" onClick={() => handleDelete(supplier)}>
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
              placeholder={t('supplierSearch.searchPlaceholder', 'Search by name...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ width: 300, direction: isUr ? 'rtl' : 'ltr' }}
            />
            <Button onClick={handleSearch} loading={loading}>
              {t('supplierSearch.searchBtn', '🔍 Search')}
            </Button>
            <Button
              variant="light"
              onClick={() => {
                setSearchTerm('');
                loadSuppliers();
              }}
            >
              {t('app.clear', 'Clear')}
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            {suppliers.length} {suppliers.length !== 1 ? t('supplierSearch.itemsFound') : t('supplierSearch.itemFound')}
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
              {selectedIds.size} {t('app.selected', 'selected')}
            </Text>
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() => {
                modals.openConfirmModal({
                  title: t('supplierSearch.bulkDeleteTitle'),
                  children: (
                    <Text size="sm">
                      {t('supplierSearch.bulkDeleteConfirm1')}{selectedIds.size}{t('supplierSearch.bulkDeleteConfirm2')}
                    </Text>
                  ),
                  labels: { confirm: t('app.deleteAll'), cancel: t('app.cancel') },
                  confirmProps: { color: 'red' },
                  onConfirm: async () => {
                    for (const id of selectedIds) {
                      await window.api.suppliers.delete(id);
                    }
                    setSelectedIds(new Set());
                    loadSuppliers();
                    notifications.show({
                      title: t('app.deleted'),
                      message: `${selectedIds.size}${t('supplierSearch.bulkDeletedMsg')}`,
                      color: 'green',
                    });
                  },
                });
              }}
            >
              {t('app.deleteSelected', '🗑️ Delete Selected')}
            </Button>
            <Button size="xs" variant="subtle" onClick={() => setSelectedIds(new Set())}>
              {t('app.clearSelection', 'Clear Selection')}
            </Button>
          </Group>
        )}
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-hidden min-h-0 mt-3 relative border border-gray-200 dark:border-gray-700 rounded-md">
        <ScrollArea className="h-full">
          {loading && initialLoad ? (
            <Center h={300}>
              <Loader size="lg" />
            </Center>
          ) : suppliers.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <Text size="xl">📭</Text>
                <Text c="dimmed">{t('supplierSearch.noItemsText', 'No vendors found')}</Text>
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
                    ['name', t('common.name', 'Name')],
                    ['city', t('common.city', 'City')],
                    ['country', t('common.country', 'Country')],
                    ['contact', t('common.contact', 'Contact')],
                    ['advance', t('supplierSearch.colAdvance', 'Advance')],
                    ['actions', t('common.actions', 'Actions')],
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-none mt-3">
          <Group justify="center" mt="sm">
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
          </Group>
        </div>
      )}
    </Card>
  );
}

SupplierSearch.propTypes = {
  onEdit: PropTypes.func,
  onRefresh: PropTypes.object,
};

export default SupplierSearch;
