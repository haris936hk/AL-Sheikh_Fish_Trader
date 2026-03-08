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

import { useResizableColumns } from '../hooks/useResizableColumns';

/**
 * CustomerSearch Component
 * Search and list customers with edit/delete actions.
 * Implements FR-CUST search requirements.
 *
 * @param {function} onEdit - Callback when edit is clicked
 * @param {function} onRefresh - Callback to refresh after delete
 */
function CustomerSearch({ onEdit, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Bulk selection (FR-GRID-006)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Column resizing (FR-GRID-008)
  const { getResizeProps } = useResizableColumns({
    name_urdu: 120,
    name_english: 130,
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
          title: 'Error',
          message: result.error || 'Failed to load customers',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Load customers error:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load customers',
        color: 'red',
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

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
            title: 'No Results',
            message: 'No customers found matching your search',
            color: 'blue',
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      notifications.show({
        title: 'Error',
        message: 'Search failed',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Handle delete with confirmation
  const handleDelete = useCallback(
    (customer) => {
      modals.openConfirmModal({
        title: 'Delete Customer',
        centered: true,
        children: (
          <Text size="sm">
            Are you sure you want to delete customer{' '}
            <strong>{customer.name || customer.name_english}</strong>? This action cannot be undone.
          </Text>
        ),
        labels: { confirm: 'Delete', cancel: 'Cancel' },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          try {
            const result = await window.api.customers.delete(customer.id);
            if (result.success) {
              notifications.show({
                title: 'Deleted',
                message: `Customer "${customer.name || customer.name_english}" has been deleted`,
                color: 'green',
              });
              loadCustomers();
              onRefresh?.();
            } else {
              notifications.show({
                title: 'Cannot Delete',
                message: result.error,
                color: 'red',
              });
            }
          } catch {
            notifications.show({
              title: 'Error',
              message: 'Failed to delete customer',
              color: 'red',
            });
          }
        },
      });
    },
    [loadCustomers, onRefresh]
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
        <Text fw={600} dir="rtl" style={{ textAlign: 'right' }}>
          {customer.name || '-'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {customer.name_english || '-'}
        </Text>
      </Table.Td>
      <Table.Td>{customer.city_name || '-'}</Table.Td>
      <Table.Td>{customer.country_name || '-'}</Table.Td>
      <Table.Td>{customer.mobile || customer.phone || customer.email || '-'}</Table.Td>
      <Table.Td>
        <Badge variant="light" color="green">
          {Number(customer.current_balance || 0).toFixed(2)}
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
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ width: 300 }}
            />
            <Button onClick={handleSearch} loading={loading}>
              🔍 Search
            </Button>
            <Button
              variant="light"
              onClick={() => {
                setSearchTerm('');
                loadCustomers();
              }}
            >
              Clear
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} found
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
              {selectedIds.size} selected
            </Text>
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() => {
                modals.openConfirmModal({
                  title: 'Delete Selected Customers',
                  children: (
                    <Text size="sm">
                      Are you sure you want to delete {selectedIds.size} selected customer(s)?
                    </Text>
                  ),
                  labels: { confirm: 'Delete All', cancel: 'Cancel' },
                  confirmProps: { color: 'red' },
                  onConfirm: async () => {
                    for (const id of selectedIds) {
                      await window.api.customers.delete(id);
                    }
                    setSelectedIds(new Set());
                    loadCustomers();
                    notifications.show({
                      title: 'Deleted',
                      message: `${selectedIds.size} customer(s) deleted`,
                      color: 'green',
                    });
                  },
                });
              }}
            >
              🗑️ Delete Selected
            </Button>
            <Button size="xs" variant="subtle" onClick={() => setSelectedIds(new Set())}>
              Clear Selection
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
                <Text c="dimmed">No customers found</Text>
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
                    ['name_urdu', 'نام', 'Urdu Name'],
                    ['name_english', 'نام (انگریزی)', 'English Name'],
                    ['city', 'شہر', 'City'],
                    ['country', 'ملک', 'Country'],
                    ['contact', 'رابطہ', 'Contact'],
                    ['balance', 'بقایا', 'Balance'],
                    ['actions', 'عمل', 'Actions'],
                  ].map(([key, urdu, english]) => {
                    const rp = getResizeProps(key);
                    return (
                      <Table.Th key={key} style={rp.style}>
                        <div style={{ fontWeight: 700 }}>{urdu}</div>
                        <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.65 }}>
                          {english}
                        </div>
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
