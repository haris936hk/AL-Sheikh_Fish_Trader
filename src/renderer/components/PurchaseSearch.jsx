import {
  Paper,
  Group,
  Text,
  Title,
  Select,
  TextInput,
  Button,
  LoadingOverlay,
  Divider,
  Grid,
  Table,
  ActionIcon,
  Checkbox,
  Badge,
  ScrollArea,
  Pagination,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import '@mantine/dates/styles.css';
import { useResizableColumns } from '../hooks/useResizableColumns';
import useStore from '../store';
import { formatDisplayName, formatDateForAPI } from '../utils/formatters';

/**
 * PurchaseSearch Component
 * Search and manage existing purchase transactions.
 * Implements FR-PURCHSEARCH-001 through FR-PURCHSEARCH-027.
 *
 * @param {function} onEdit - Callback to edit a purchase
 */
function PurchaseSearch({ onEdit }) {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const isUr = language === 'ur';
  const { t: translate } = useTranslation();
  const t = useMemo(
    () => ({
      title: translate('purchaseSearch.title', 'Search Purchases'),
      filterDate: translate('purchaseSearch.filterDate', 'Filter by Date'),
      dateFrom: translate('common.dateFrom', 'From Date'),
      dateTo: translate('common.dateTo', 'To Date'),
      filterSupplier: translate('purchaseSearch.filterSupplier', 'Filter by Supplier'),
      supplier: translate('common.supplier', 'Supplier'),
      purchNo: translate('purchaseSearch.purchNo', 'Purchase #'),
      search: translate('common.search', 'Search'),
      selected: translate('common.selected', 'selected'),
      deleteSelectedTitle: translate('purchaseSearch.deleteSelectedTitle', 'Delete Selected Purchases'),
      deleteSelectedMsg: (count) => translate('purchaseSearch.deleteSelectedMsg', 'Are you sure you want to delete {{count}} selected purchase(s)?', { count }),
      deleteAll: translate('common.deleteAll', 'Delete All'),
      cancel: translate('common.cancel', 'Cancel'),
      deleteSelectedBtn: translate('common.deleteSelectedBtn', 'Delete Selected'),
      clearSelection: translate('common.clearSelection', 'Clear Selection'),
      recordsFound: translate('common.recordsFound', 'Records Found'),
      noPurchasesFound: translate('purchaseSearch.noPurchasesFound', 'No purchases found. Use the filters above to search.'),
      purchNumCol: translate('purchaseSearch.purchNo', 'Purchase #'),
      dateCol: translate('common.date', 'Date'),
      supplierCol: translate('common.supplier', 'Supplier'),
      vehicleCol: translate('common.vehicleNo', 'Vehicle No'),
      weightCol: translate('common.weight', 'Weight (kg)'),
      netAmtCol: translate('common.netAmount', 'Net Amount'),
      balanceCol: translate('common.balance', 'Balance'),
      statusCol: translate('common.status', 'Status'),
      actionsCol: translate('common.actions', 'Actions'),
      valErrorTitle: translate('error.validationError', 'Validation Error'),
      valErrorDateMsg: translate('error.dateOrderMsg', 'Start date cannot be after end date'),
      noResultsTitle: translate('search.noResultsTitle', 'No Results'),
      noResultsMsg: translate('purchaseSearch.noResultsMsg', 'No purchases found matching the criteria'),
      searchErrorTitle: translate('error.title', 'Error'),
      searchErrorMsg: translate('purchaseSearch.searchErrorMsg', 'Failed to search purchases'),
      deleteTitle: translate('purchaseSearch.deleteTitle', 'Delete Purchase'),
      deleteMsg: (num) => translate('purchaseSearch.deleteMsg', 'Are you sure you want to delete purchase <strong>{{num}}</strong>? This action cannot be undone. Stock and supplier balance will be restored.', { num }),
      deleteConfirm: translate('common.delete', 'Delete'),
      deleteSuccessTitle: translate('common.success', 'Success'),
      deleteSuccessMsg: translate('purchaseSearch.deleteSuccessMsg', 'Purchase deleted successfully'),
      deleteErrorTitle: translate('error.title', 'Error'),
      deleteErrorMsg: translate('purchaseSearch.deleteErrorMsg', 'Failed to delete purchase'),
    }),
    [translate]
  );

  // Filters
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [filterByDate, setFilterByDate] = useState(true);
  const [filterBySupplier, setFilterBySupplier] = useState(false);
  const [purchaseNumber, setPurchaseNumber] = useState('');

  // Bulk selection (FR-GRID-006)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Column resizing (FR-GRID-008)
  const { getResizeProps } = useResizableColumns({
    purchNum: 100,
    date: 100,
    supplier: 180,
    vehicle: 100,
    weight: 100,
    netAmt: 120,
    balance: 120,
    status: 80,
    actions: 100,
  });

  // Load suppliers on mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await window.api.suppliers.getAll();
        if (response.success) {
          setSuppliers(
            response.data.map((s) => ({
              value: String(s.id),
              label: formatDisplayName(s.name, s.name_english, isUr),
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load suppliers:', error);
      }
    };
    loadSuppliers();
  }, [isUr]);

  // Search purchases
  const handleSearch = useCallback(async () => {
    if (filterByDate && dateFrom > dateTo) {
      notifications.show({
        title: t.valErrorTitle,
        message: t.valErrorDateMsg,
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const filters = {
        dateFrom: formatDateForAPI(dateFrom),
        dateTo: formatDateForAPI(dateTo),
        filterByDate,
        supplierId: filterBySupplier && selectedSupplier ? parseInt(selectedSupplier) : null,
        filterBySupplier,
        purchaseNumber: purchaseNumber || null,
      };

      const response = await window.api.purchases.search(filters);

      if (response.success) {
        setPurchases(response.data);
        setPage(1);
        if (response.data.length === 0) {
          notifications.show({
            title: t.noResultsTitle,
            message: t.noResultsMsg,
            color: 'yellow',
          });
        }
      } else {
        notifications.show({
          title: t.searchErrorTitle,
          message: response.error || t.searchErrorMsg,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      notifications.show({
        title: t.searchErrorTitle,
        message: t.searchErrorMsg,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, filterByDate, selectedSupplier, filterBySupplier, purchaseNumber, t]);

  // Delete purchase
  const handleDelete = useCallback(
    (purchase) => {
      modals.openConfirmModal({
        title: t.deleteTitle,
        children: (
          <Text
            size="sm"
            dangerouslySetInnerHTML={{ __html: t.deleteMsg(purchase.purchase_number) }}
          />
        ),
        labels: { confirm: t.deleteConfirm, cancel: t.cancel },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          setLoading(true);
          try {
            const response = await window.api.purchases.delete(purchase.id);
            if (response.success) {
              notifications.show({
                title: t.deleteSuccessTitle,
                message: t.deleteSuccessMsg,
                color: 'green',
              });
              handleSearch();
            } else {
              notifications.show({
                title: t.deleteErrorTitle,
                message: response.error || t.deleteErrorMsg,
                color: 'red',
              });
            }
          } catch (error) {
            console.error('Delete error:', error);
            notifications.show({
              title: t.deleteErrorTitle,
              message: t.deleteErrorMsg,
              color: 'red',
            });
          } finally {
            setLoading(false);
          }
        },
      });
    },
    [handleSearch, t]
  );

  // Format display date
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <Paper shadow="sm" p="sm" radius="md" withBorder pos="relative" className="h-full flex flex-col overflow-hidden">
      <LoadingOverlay visible={loading} />

      <div className="flex-none flex flex-col gap-3">
        <Title order={4} className="text-green-700 m-0">
          🔍 {t.title}
        </Title>

        <Divider />

        {/* Filters */}
        <Grid align="flex-end" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Group grow gap="xs" align="flex-end">
              <DatePickerInput
                label={t.dateFrom}
                placeholder=""
                value={dateFrom}
                onChange={setDateFrom}
                maxDate={dateTo || undefined}
                disabled={!filterByDate}
              />
              <DatePickerInput
                label={t.dateTo}
                placeholder=""
                value={dateTo}
                onChange={setDateTo}
                minDate={dateFrom || undefined}
                disabled={!filterByDate}
              />
            </Group>
            <Checkbox
              label={t.filterDate}
              checked={filterByDate}
              onChange={(e) => setFilterByDate(e.target.checked)}
              mt="xs"
              size="xs"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              label={t.supplier}
              placeholder=""
              data={suppliers}
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              searchable
              clearable
              disabled={!filterBySupplier}
            />
            <Checkbox
              label={t.filterSupplier}
              checked={filterBySupplier}
              onChange={(e) => setFilterBySupplier(e.target.checked)}
              mt="xs"
              size="xs"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 2 }}>
            <TextInput
              label={t.purchNo}
              placeholder=""
              value={purchaseNumber}
              onChange={(e) => setPurchaseNumber(e.target.value)}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }} pb="lg">
            <Group justify="flex-end">
              <Button variant="filled" color="green" onClick={handleSearch}>
                {t.search}
              </Button>
            </Group>
          </Grid.Col>
        </Grid>

        <Divider />

        {/* Bulk Actions (FR-GRID-006) */}
        {selectedIds.size > 0 && (
          <Group
            gap="sm"
            p="xs"
            style={{
              background: 'var(--mantine-color-green-0)',
              borderRadius: 8,
              direction: isUr ? 'rtl' : 'ltr',
            }}
          >
            <Text size="sm" fw={500}>
              {selectedIds.size} {t.selected}
            </Text>
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() => {
                modals.openConfirmModal({
                  title: t.deleteSelectedTitle,
                  children: <Text size="sm">{t.deleteSelectedMsg(selectedIds.size)}</Text>,
                  labels: { confirm: t.deleteAll, cancel: t.cancel },
                  confirmProps: { color: 'red' },
                  onConfirm: async () => {
                    for (const id of selectedIds) {
                      await window.api.purchases.delete(id);
                    }
                    setSelectedIds(new Set());
                    handleSearch();
                    notifications.show({
                      title: t.deleteSuccessTitle,
                      message: t.deleteSuccessMsg,
                      color: 'green',
                    });
                  },
                });
              }}
            >
              🗑️ {t.deleteSelectedBtn}
            </Button>
            <Button size="xs" variant="subtle" onClick={() => setSelectedIds(new Set())}>
              {t.clearSelection}
            </Button>
          </Group>
        )}

        {/* Results */}
        <Group justify="space-between" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Text size="sm" c="dimmed">
            {t.recordsFound}: <strong>{purchases.length}</strong>
          </Text>
        </Group>
      </div>

      <div className="flex-1 overflow-hidden min-h-0 mt-3 relative border border-gray-200 dark:border-gray-700 rounded-md">
        <ScrollArea className="h-full" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Table striped withTableBorder withColumnBorders highlightOnHover style={{ tableLayout: 'fixed' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }}>
                  <Checkbox
                    checked={
                      purchases.length > 0 &&
                      purchases
                        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                        .every((p) => selectedIds.has(p.id))
                    }
                    indeterminate={
                      purchases
                        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                        .some((p) => selectedIds.has(p.id)) &&
                      !purchases
                        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                        .every((p) => selectedIds.has(p.id))
                    }
                    onChange={(e) => {
                      const pageIds = purchases
                        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                        .map((p) => p.id);
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        pageIds.forEach((id) =>
                          e.target.checked ? next.add(id) : next.delete(id)
                        );
                        return next;
                      });
                    }}
                  />
                </Table.Th>
                {[
                  ['purchNum', t.purchNumCol, ''],
                  ['date', t.dateCol, ''],
                  ['supplier', t.supplierCol, ''],
                  ['vehicle', t.vehicleCol, ''],
                  ['weight', t.weightCol, ''],
                  ['netAmt', t.netAmtCol, ''],
                  ['balance', t.balanceCol, ''],
                  ['status', t.statusCol, ''],
                  ['actions', t.actionsCol, ''],
                ].map(([key, label]) => {
                  const rp = getResizeProps(key);
                  return (
                    <Table.Th
                      key={key}
                      style={{
                        ...rp.style,
                        textAlign: ['weight', 'netAmt', 'balance'].includes(key)
                          ? isUr
                            ? 'left'
                            : 'right'
                          : isUr
                            ? 'right'
                            : 'left',
                      }}
                    >
                      <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
                      <div {...rp.resizeHandle} />
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {purchases.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Text c="dimmed" ta="center" py="xl">
                      {t.noPurchasesFound}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                purchases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((purchase) => (
                  <Table.Tr
                    key={purchase.id}
                    bg={selectedIds.has(purchase.id) ? 'green.0' : undefined}
                  >
                    <Table.Td>
                      <Checkbox
                        checked={selectedIds.has(purchase.id)}
                        onChange={(e) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            e.target.checked ? next.add(purchase.id) : next.delete(purchase.id);
                            return next;
                          });
                        }}
                      />
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      <Text fw={500}>{purchase.purchase_number}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {formatDisplayDate(purchase.purchase_date)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {purchase.supplier_name || '-'}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {purchase.vehicle_number || '-'}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {(purchase.total_weight || 0).toFixed(2)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      {Math.round(purchase.net_amount || 0).toLocaleString('en-US')}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      <Text c={purchase.balance_amount > 0 ? 'red' : 'green'}>
                        {Math.round(purchase.balance_amount || 0).toLocaleString('en-US')}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      <Badge
                        color={purchase.status === 'posted' ? 'green' : 'orange'}
                        variant="light"
                        size="sm"
                      >
                        {purchase.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          color="blue"
                          variant="subtle"
                          onClick={() => onEdit?.(purchase)}
                          title={
                            purchase.status === 'posted'
                              ? translate('purchaseSearch.postedNoEdit')
                              : translate('app.edit')
                          }
                          disabled={purchase.status === 'posted'}
                        >
                          ✏️
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => handleDelete(purchase)}
                          title={
                            purchase.status === 'posted'
                              ? translate('purchaseSearch.postedNoDelete')
                              : translate('app.delete')
                          }
                          disabled={purchase.status === 'posted'}
                        >
                          🗑️
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </div>

      {/* Pagination */}
      {Math.ceil(purchases.length / PAGE_SIZE) > 1 && (
        <div className="flex-none">
          <Group justify="center" mt="sm">
            <Pagination
              total={Math.ceil(purchases.length / PAGE_SIZE)}
              value={page}
              onChange={setPage}
              size="sm"
            />
          </Group>
        </div>
      )}
    </Paper>
  );
}

PurchaseSearch.propTypes = {
  onEdit: PropTypes.func,
};

export default PurchaseSearch;
