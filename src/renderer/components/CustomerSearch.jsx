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
 * CustomerSearch Component
 * Search and list customers with edit/delete actions.
 * Implements FR-CUST search requirements.
 *
 * @param {function} onEdit - Callback when edit is clicked
 * @param {function} onRefresh - Callback to refresh after delete
 */
function CustomerSearch({ onEdit, onRefresh }) {
  const isUr = useStore((s) => s.language === 'ur');
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Bulk selection (FR-GRID-006)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Column resizing (FR-GRID-008)
  const { getResizeProps } = useResizableColumns({
    name: 200,
    city: 110,
    country: 110,
    contact: 140,
    balance: 90,
    actions: 90,
  });

  // Load all customers initially
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.customers.getAll();
      if (result.success) {
        setCustomers(result.data);
      } else {
        notifications.show({
          title: t('error.title'),
          message: result.error || t('customerSearch.failedLoadData'),
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Load customers error:', error);
      notifications.show({
        title: t('error.title'),
        message: t('customerSearch.failedLoadData'),
        color: 'red',
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [t]);

  // Load on mount
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Search customers
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const result = searchTerm.trim()
        ? await window.api.customers.search(searchTerm)
        : await window.api.customers.getAll();

      if (result.success) {
        setCustomers(result.data);
        if (result.data.length === 0) {
          notifications.show({
            title: t('search.noResultsTitle'),
            message: t('customerSearch.noResultsMsg'),
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
    (customer) => {
      modals.openConfirmModal({
        title: t('customerSearch.deleteTitle'),
        centered: true,
        children: (
          <Text size="sm">
            {t('customerSearch.deleteConfirm1')}<strong>{formatDisplayName(customer.name, customer.name_english, isUr)}</strong>{t('customerSearch.deleteConfirm2')}
          </Text>
        ),
        labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          try {
            const result = await window.api.customers.delete(customer.id);
            if (result.success) {
              notifications.show({
                title: t('app.deleted'),
                message: `${t('customerSearch.deletedMsg1')}${formatDisplayName(customer.name, customer.name_english, isUr)}${t('customerSearch.deletedMsg2')}`,
                color: 'green',
              });
              loadCustomers();
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
              message: t('customerSearch.failedDelete'),
              color: 'red',
            });
          }
        },
      });
    },
    [loadCustomers, onRefresh, isUr, t]
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
      loadCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh?.refreshKey]);

  // Table rows
  const rows = customers.map((customer) => (
    <Table.Tr key={customer.id} bg={selectedIds.has(customer.id) ? 'green.0' : undefined}>
      <Table.Td>
        <Checkbox
          checked={selectedIds.has(customer.id)}
          onChange={(e) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              e.target.checked ? next.add(customer.id) : next.delete(customer.id);
              return next;
            });
          }}
        />
      </Table.Td>
      <Table.Td>
        <Text fw={600} dir={isUr ? 'rtl' : 'ltr'} style={{ textAlign: isUr ? 'right' : 'left' }}>
          {formatDisplayName(customer.name, customer.name_english, isUr)}
        </Text>
      </Table.Td>
      <Table.Td>{customer.city_name || '-'}</Table.Td>
      <Table.Td>{customer.country_name || '-'}</Table.Td>
      <Table.Td>{customer.mobile || customer.phone || customer.email || '-'}</Table.Td>
      <Table.Td>
        <Badge variant="light" color="green">
          {Math.round(Number(customer.current_balance || 0)).toLocaleString('en-US')}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label={t('app.edit')}>
            <ActionIcon variant="light" color="blue" onClick={() => onEdit?.(customer)}>
              <span>✏️</span>
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('app.delete')}>
            <ActionIcon variant="light" color="red" onClick={() => handleDelete(customer)}>
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
              placeholder={t('customerSearch.searchPlaceholder', 'Search by name...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ width: 300, direction: isUr ? 'rtl' : 'ltr' }}
            />
            <Button onClick={handleSearch} loading={loading}>
              {t('customerSearch.searchBtn', '🔍 Search')}
            </Button>
            <Button
              variant="light"
              onClick={() => {
                setSearchTerm('');
                loadCustomers();
              }}
            >
              {t('app.clear', 'Clear')}
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            {customers.length} {customers.length !== 1 ? t('customerSearch.itemsFound') : t('customerSearch.itemFound')}
          </Text>
        </Group>

        {/* Bulk Actions (FR-GRID-006) */}
        {selectedIds.size > 0 && (
          <Group
            gap="sm"
            p="xs"
            style={{ background: 'var(--mantine-color-green-0)', borderRadius: 8 }}
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
                  title: t('customerSearch.bulkDeleteTitle'),
                  children: (
                    <Text size="sm">
                      {t('customerSearch.bulkDeleteConfirm1')}{selectedIds.size}{t('customerSearch.bulkDeleteConfirm2')}
                    </Text>
                  ),
                  labels: { confirm: t('app.deleteAll'), cancel: t('app.cancel') },
                  confirmProps: { color: 'red' },
                  onConfirm: async () => {
                    for (const id of selectedIds) {
                      await window.api.customers.delete(id);
                    }
                    setSelectedIds(new Set());
                    loadCustomers();
                    notifications.show({
                      title: t('app.deleted'),
                      message: `${selectedIds.size}${t('customerSearch.bulkDeletedMsg')}`,
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
          ) : customers.length === 0 ? (
            <Center h={200}>
              <Stack align="center" gap="sm">
                <Text size="xl">📭</Text>
                <Text c="dimmed">{t('customerSearch.noItemsText', 'No customers found')}</Text>
              </Stack>
            </Center>
          ) : (
            <Table striped highlightOnHover style={{ tableLayout: 'fixed' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }}>
                    <Checkbox
                      checked={
                        customers.length > 0 && customers.every((c) => selectedIds.has(c.id))
                      }
                      indeterminate={
                        customers.some((c) => selectedIds.has(c.id)) &&
                        !customers.every((c) => selectedIds.has(c.id))
                      }
                      onChange={(e) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          customers.forEach((c) =>
                            e.target.checked ? next.add(c.id) : next.delete(c.id)
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
                    ['balance', t('customerSearch.colBalance', 'Balance')],
                    ['actions', t('common.actions', 'Actions')],
                  ].map(([key, label]) => {
                    const rp = getResizeProps(key);
                    return (
                      <Table.Th key={key} style={rp.style}>
                        <div style={{ fontWeight: 700 }}>{label}</div>
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
    </Card>
  );
}

CustomerSearch.propTypes = {
  onEdit: PropTypes.func,
  onRefresh: PropTypes.object,
};

export default CustomerSearch;
