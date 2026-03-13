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
import { useState, useCallback, useEffect, useMemo } from 'react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const t = useMemo(
    () => ({
      error: isUr ? 'خرابی' : 'Error',
      failedLoadData: isUr ? 'صارفین لوڈ کرنے میں ناکام' : 'Failed to load customers',
      noResultsTitle: isUr ? 'کوئی نتیجہ نہیں' : 'No Results',
      noResultsMsg: isUr ? 'آپ کی تلاش کے مطابق کوئی صارف نہیں ملا' : 'No customers found matching your search',
      searchFailed: isUr ? 'تلاش ناکام ہو گئی' : 'Search failed',
      deleteTitle: isUr ? 'صارف حذف کریں' : 'Delete Customer',
      deleteBtn: isUr ? 'حذف کریں' : 'Delete',
      cancelBtn: isUr ? 'منسوخ' : 'Cancel',
      deletedTitle: isUr ? 'حذف ہو گیا' : 'Deleted',
      cannotDelete: isUr ? 'حذف نہیں کر سکتے' : 'Cannot Delete',
      failedDelete: isUr ? 'صارف حذف کرنے میں ناکام' : 'Failed to delete customer',
      searchPlaceholder: isUr ? 'نام سے تلاش کریں...' : 'Search by name...',
      searchBtn: isUr ? 'تلاش کریں' : '🔍 Search',
      clearBtn: isUr ? 'صاف کریں' : 'Clear',
      itemsFound: isUr ? 'صارفین ملے' : 'customers found',
      itemFound: isUr ? 'صارف ملا' : 'customer found',
      noItemsText: isUr ? 'کوئی صارف نہیں ملا' : 'No customers found',
      colName: isUr ? 'نام' : 'Name',
      colCity: isUr ? 'شہر' : 'City',
      colCountry: isUr ? 'ملک' : 'Country',
      colContact: isUr ? 'رابطہ' : 'Contact',
      colBalance: isUr ? 'بقایا' : 'Balance',
      colActions: isUr ? 'عمل' : 'Actions',
      deleteConfirm1: isUr ? 'کیا آپ واقعی صارف ' : 'Are you sure you want to delete customer ',
      deleteConfirm2: isUr ? ' کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔' : '? This action cannot be undone.',
      deletedMsg1: isUr ? 'صارف "' : 'Customer "',
      deletedMsg2: isUr ? '" حذف ہو گیا ہے' : '" has been deleted',
      bulkDeleteTitle: isUr ? 'منتخب صارفین حذف کریں' : 'Delete Selected Customers',
      bulkDeleteConfirm1: isUr ? 'کیا آپ واقعی ' : 'Are you sure you want to delete ',
      bulkDeleteConfirm2: isUr ? ' منتخب صارفین حذف کرنا چاہتے ہیں؟' : ' selected customer(s)?',
      bulkDeleteBtn: isUr ? 'سب کو حذف کریں' : 'Delete All',
      bulkDeletedMsg: isUr ? ' صارفین حذف ہو گئے' : ' customer(s) deleted',
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
          title: t.error,
          message: result.error || t.failedLoadData,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Load customers error:', error);
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
    (customer) => {
      modals.openConfirmModal({
        title: t.deleteTitle,
        centered: true,
        children: (
          <Text size="sm">
            {t.deleteConfirm1}<strong>{formatDisplayName(customer.name, customer.name_english, isUr)}</strong>{t.deleteConfirm2}
          </Text>
        ),
        labels: { confirm: t.deleteBtn, cancel: t.cancelBtn },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          try {
            const result = await window.api.customers.delete(customer.id);
            if (result.success) {
              notifications.show({
                title: t.deletedTitle,
                message: `${t.deletedMsg1}${formatDisplayName(customer.name, customer.name_english, isUr)}${t.deletedMsg2}`,
                color: 'green',
              });
              loadCustomers();
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
          <Tooltip label="Edit">
            <ActionIcon variant="light" color="blue" onClick={() => onEdit?.(customer)}>
              <span>✏️</span>
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="light" color="red" onClick={() => handleDelete(customer)}>
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
                loadCustomers();
              }}
            >
              {t.clearBtn}
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            {customers.length} {customers.length !== 1 ? t.itemsFound : t.itemFound}
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
                      await window.api.customers.delete(id);
                    }
                    setSelectedIds(new Set());
                    loadCustomers();
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
          ) : customers.length === 0 ? (
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
                    ['name', isUr ? 'نام' : 'Name', t.colName],
                    ['city', isUr ? 'شہر' : 'City', t.colCity],
                    ['country', isUr ? 'ملک' : 'Country', t.colCountry],
                    ['contact', isUr ? 'رابطہ' : 'Contact', t.colContact],
                    ['balance', isUr ? 'بقایا' : 'Balance', t.colBalance],
                    ['actions', isUr ? 'عمل' : 'Actions', t.colActions],
                  ].map(([key, urdu, english]) => {
                    const rp = getResizeProps(key);
                    return (
                      <Table.Th key={key} style={rp.style}>
                        <div style={{ fontWeight: 700 }}>{isUr ? urdu : english}</div>
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
      </Stack>
    </Card>
  );
}

CustomerSearch.propTypes = {
  onEdit: PropTypes.func,
  onRefresh: PropTypes.object,
};

export default CustomerSearch;
