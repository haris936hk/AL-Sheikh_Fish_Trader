import {
  Paper,
  Stack,
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

import '@mantine/dates/styles.css';
import { useResizableColumns } from '../hooks/useResizableColumns';
import useStore from '../store';
import { formatDisplayName } from '../utils/formatters';

/**
 * SaleSearch Component
 * Search and manage existing sales transactions.
 * Implements FR-SALESEARCH-001 through FR-SALESEARCH-034.
 *
 * @param {function} onEdit - Callback to edit a sale
 */
function SaleSearch({ onEdit }) {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const isUr = language === 'ur';
  const t = useMemo(
    () => ({
      title: isUr ? 'بکری تلاش' : 'Search Sales',
      dateFrom: isUr ? 'شروع تاریخ' : 'From Date',
      dateTo: isUr ? 'اختتام تاریخ' : 'To Date',
      customer: isUr ? 'گاہک' : 'Customer',
      allCustomers: isUr ? 'تمام گاہک' : 'All Customers',
      saleNo: isUr ? 'بکری نمبر' : 'Sale #',
      searchBySaleNo: isUr ? 'بکری نمبر سے تلاش' : 'Search by Sale #',
      printSlips: isUr ? 'تمام رسیدیں پرنٹ' : 'Print All Customer Slips',
      search: isUr ? 'تلاش' : 'Search',
      selected: isUr ? 'منتخب' : 'selected',
      deleteSelectedTitle: isUr ? 'منتخب بکریاں حذف کریں' : 'Delete Selected Sales',
      deleteSelectedMsg: (count) =>
        isUr
          ? `کیا آپ ${count} منتخب بکری(یاں) حذف کرنا چاہتے ہیں؟`
          : `Are you sure you want to delete ${count} selected sale(s)?`,
      deleteAll: isUr ? 'حذف کریں' : 'Delete All',
      cancel: isUr ? 'منسوخ' : 'Cancel',
      deleteSelectedBtn: isUr ? 'منتخب حذف کریں' : 'Delete Selected',
      clearSelection: isUr ? 'انتخاب صاف کریں' : 'Clear Selection',
      recordsFound: isUr ? 'ریکارڈ ملے' : 'Records Found',
      noSalesFound: isUr
        ? 'کوئی بکری نہیں ملی — اوپر کے فلٹر استعمال کریں۔'
        : 'No sales found. Use the filters above to search.',
      noSalesFoundEn: isUr ? '' : '',
      saleNumCol: isUr ? 'بکری نمبر' : 'Sale #',
      dateCol: isUr ? 'تاریخ' : 'Date',
      customerCol: isUr ? 'گاہک' : 'Customer',
      supplierCol: isUr ? 'بیوپاری' : 'Supplier',
      vehicleCol: isUr ? 'گاڑی نمبر' : 'Vehicle No',
      netAmtCol: isUr ? 'خالص رقم' : 'Net Amount',
      balanceCol: isUr ? 'بقایا' : 'Balance',
      statusCol: isUr ? 'حالت' : 'Status',
      actionsCol: isUr ? 'عمل' : 'Actions',
      deleteTitle: isUr ? 'بکری حذف کریں' : 'Delete Sale',
      deleteMsg: (num) =>
        isUr
          ? `کیا آپ واقعی بکری <strong>${num}</strong> حذف کرنا چاہتے ہیں؟ یہ عمل ناقابل واپسی ہے۔ سٹاک اور گاہک کا بیلنس بحال ہو جائے گا۔`
          : `Are you sure you want to delete sale <strong>${num}</strong>? This action cannot be undone. Stock and customer balance will be restored.`,
      deleteConfirm: isUr ? 'حذف کریں' : 'Delete',
      deleteSuccessTitle: isUr ? 'کامیابی' : 'Success',
      deleteSuccessMsg: isUr ? 'بکری کامیابی سے حذف ہو گئی' : 'Sale deleted successfully',
      deleteErrorTitle: isUr ? 'خرابی' : 'Error',
      deleteErrorMsg: isUr ? 'بکری حذف کرنے میں خرابی' : 'Failed to delete sale',
      valErrorTitle: isUr ? 'توثیق کی خرابی' : 'Validation Error',
      valErrorDateMsg: isUr
        ? 'شروع کی تاریخ اختتام کی تاریخ کے بعد نہیں ہو سکتی'
        : 'Start date cannot be after end date',
      noResultsTitle: isUr ? 'کوئی نتیجہ نہیں' : 'No Results',
      noResultsMsg: isUr
        ? 'معیار کے مطابق کوئی بکری نہیں ملی'
        : 'No sales found matching the criteria',
      searchErrorTitle: isUr ? 'خرابی' : 'Error',
      searchErrorMsg: isUr ? 'بکریاں تلاش کرنے میں خرابی' : 'Failed to search sales',
      noDataTitle: isUr ? 'کوئی ڈیٹا نہیں' : 'No Data',
      noDataMsg: isUr ? 'پرنٹ کرنے کے لیے کوئی بکریاں نہیں ہیں' : 'No sales to print',
      printErrorMsg: isUr ? 'گاہک کی رسیدیں بنانے میں ناکام' : 'Failed to generate customer slips',
      printAllTitle: isUr ? 'تمام گاہک کی رسیدیں' : 'All Customer Slips',
      receiptTitle: isUr ? 'بکری رسید' : 'Sale Receipt',
      itemCol: isUr ? 'مچھلی' : 'Item',
      weightCol: isUr ? 'وزن' : 'Weight',
      rateCol: isUr ? 'ریٹ' : 'Rate',
      amountCol: isUr ? 'رقم' : 'Amount',
      cashReceivedCol: isUr ? 'نقد وصولی' : 'Cash Received',
    }),
    [isUr]
  );

  // Filters
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [allCustomers, setAllCustomers] = useState(true);
  const [saleNumber, setSaleNumber] = useState('');
  const [searchBySaleNumber, setSearchBySaleNumber] = useState(false);

  // Bulk selection (FR-GRID-006)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Column resizing (FR-GRID-008)
  const { getResizeProps } = useResizableColumns({
    saleNum: 90,
    date: 100,
    customer: 150,
    supplier: 150,
    vehicle: 100,
    netAmt: 120,
    balance: 120,
    status: 80,
    actions: 100,
  });

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await window.api.customers.getAll();
        if (response.success) {
          setCustomers(
            response.data.map((c) => ({
              value: String(c.id),
              label: formatDisplayName(c.name, c.name_english, isUr),
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    };
    loadCustomers();
  }, [isUr]);

  // Format date for API
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Search sales
  const handleSearch = useCallback(async () => {
    if (dateFrom > dateTo) {
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
        dateFrom: formatDate(dateFrom),
        dateTo: formatDate(dateTo),
        customerId: !allCustomers ? parseInt(selectedCustomer) : null,
        allCustomers,
        saleNumber: searchBySaleNumber ? saleNumber : null,
      };

      const response = await window.api.sales.search(filters);

      if (response.success) {
        setSales(response.data);
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
  }, [dateFrom, dateTo, selectedCustomer, allCustomers, saleNumber, searchBySaleNumber, t]);

  // Delete sale
  const handleDelete = useCallback(
    (sale) => {
      modals.openConfirmModal({
        title: t.deleteTitle,
        children: (
          <Text size="sm" dangerouslySetInnerHTML={{ __html: t.deleteMsg(sale.sale_number) }} />
        ),
        labels: { confirm: t.deleteConfirm, cancel: t.cancel },
        confirmProps: { color: 'red' },
        onConfirm: async () => {
          setLoading(true);
          try {
            const response = await window.api.sales.delete(sale.id);
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

  // Print All Client Slips (FR-SALESEARCH-025)
  const handlePrintAllSlips = useCallback(async () => {
    if (sales.length === 0) {
      notifications.show({ title: t.noDataTitle, message: t.noDataMsg, color: 'yellow' });
      return;
    }

    try {
      setLoading(true);
      // Fetch full details for each sale
      const saleDetails = [];
      for (const sale of sales) {
        const resp = await window.api.sales.getById(sale.id);
        if (resp.success) saleDetails.push(resp.data);
      }

      const slipHtml = saleDetails
        .map((sale) => {
          const itemRows = (sale.items || [])
            .map((item) => {
              const netWeight = (item.weight || 0) - (item.tare_weight || 0);
              const amount = netWeight * (item.rate || 0);
              return `<tr>
                        <td>${item.item_name || ''}</td>
                        <td style="text-align:right">${netWeight.toFixed(2)}</td>
                        <td style="text-align:right">${(item.rate || 0).toFixed(2)}</td>
                        <td style="text-align:right">${Math.round(amount).toLocaleString('en-US')}</td>
                    </tr>`;
            })
            .join('');

          return `<div class="slip">
                    <div class="header">
                        <h2>AL-SHEIKH FISH TRADER AND DISTRIBUTER</h2>
                        <p style="font-size:16px;direction:rtl">اے ایل شیخ فش ٹریڈر اینڈ ڈسٹری بیوٹر</p>
                        <p>Shop No. W-644 Gunj Mandi Rawalpindi</p>
                        <p>Ph: +92-3008501724 | 051-5534607</p>
                        <h3>${t.receiptTitle}</h3>
                    </div>
                    <div class="info">
                        <span><strong>${t.receiptNo}:</strong> ${sale.sale_number}</span>
                        <span><strong>${t.date}:</strong> ${formatDisplayDate(sale.sale_date)}</span>
                        <span><strong>${t.customer}:</strong> ${sale.customer_name || '-'}</span>
                    </div>
                    <table>
                        <thead><tr><th style="text-align:${isUr ? 'right' : 'left'}">${t.itemCol}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t.weightCol} (kg)</th><th style="text-align:${isUr ? 'right' : 'left'}">${t.rateCol}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t.amountCol}</th></tr></thead>
                        <tbody>${itemRows}</tbody>
                    </table>
                    <table class="totals">
                        <tr><td>${t.netAmtCol}:</td><td><strong>Rs. ${Math.round(sale.net_amount || 0).toLocaleString('en-US')}</strong></td></tr>
                        <tr><td>${t.cashReceivedCol}:</td><td>Rs. ${Math.round(sale.cash_received || 0).toLocaleString('en-US')}</td></tr>
                        <tr class="grand-total"><td>${t.balanceCol}:</td><td>Rs. ${Math.round(sale.balance_amount || 0).toLocaleString('en-US')}</td></tr>
                    </table>
                </div>`;
        })
        .join('');

      const html = `<!DOCTYPE html><html dir="${isUr ? 'rtl' : 'ltr'}"><head><title>${t.printAllTitle}</title>
            <style>
                @page { margin: 1cm; }
                body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 0; color: #333; direction: ${isUr ? 'rtl' : 'ltr'}; }
                .slip { padding: 20px; page-break-after: always; }
                .slip:last-child { page-break-after: auto; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
                .header h2 { margin: 0; } .header h3 { margin: 10px 0 0; } .header p { margin: 3px 0; font-size: 12px; }
                .info { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
                th { background: #f5f5f5; text-align: ${isUr ? 'right' : 'left'}; }
                .totals { text-align: ${isUr ? 'right' : 'left'}; font-size: 13px; } .totals td { border: none; padding: 3px 8px; }
                .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #333 !important; }
                @media print { body { padding: 0; } }
            </style></head><body>${slipHtml}</body></html>`;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    } catch (error) {
      console.error('Print all slips error:', error);
      notifications.show({
        title: t.searchErrorTitle,
        message: t.printErrorMsg,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [sales, t, isUr]);

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder pos="relative">
      <LoadingOverlay visible={loading} />

      <Stack gap="md">
        <Title order={4} className="text-blue-700">
          🔍 {t.title}
        </Title>

        <Divider />

        {/* Filters */}
        <Grid align="flex-end" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <DatePickerInput
              label={t.dateFrom}
              placeholder=""
              value={dateFrom}
              onChange={setDateFrom}
              maxDate={dateTo || undefined}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <DatePickerInput
              label={t.dateTo}
              placeholder=""
              value={dateTo}
              onChange={setDateTo}
              minDate={dateFrom || undefined}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              label={t.customer}
              placeholder=""
              data={customers}
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              searchable
              clearable
              disabled={allCustomers}
            />
            <Checkbox
              label={t.allCustomers}
              checked={allCustomers}
              onChange={(e) => setAllCustomers(e.target.checked)}
              mt="xs"
              size="xs"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <TextInput
              label={t.saleNo}
              placeholder=""
              value={saleNumber}
              onChange={(e) => setSaleNumber(e.target.value)}
              disabled={!searchBySaleNumber}
            />
            <Checkbox
              label={t.searchBySaleNo}
              checked={searchBySaleNumber}
              onChange={(e) => setSearchBySaleNumber(e.target.checked)}
              mt="xs"
              size="xs"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }} pb="lg">
            <Group justify="flex-end">
              <Button
                variant="light"
                color="teal"
                onClick={handlePrintAllSlips}
                disabled={sales.length === 0}
              >
                🖨️ {t.printSlips}
              </Button>
              <Button variant="filled" color="blue" onClick={handleSearch}>
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
              background: 'var(--mantine-color-blue-0)',
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
                      await window.api.sales.delete(id);
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
            {t.recordsFound}: <strong>{sales.length}</strong>
          </Text>
        </Group>

        <ScrollArea h={400} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Table striped withTableBorder withColumnBorders highlightOnHover style={{ tableLayout: 'fixed' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }}>
                  <Checkbox
                    checked={
                      sales.length > 0 &&
                      sales
                        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                        .every((s) => selectedIds.has(s.id))
                    }
                    indeterminate={
                      sales
                        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                        .some((s) => selectedIds.has(s.id)) &&
                      !sales
                        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                        .every((s) => selectedIds.has(s.id))
                    }
                    onChange={(e) => {
                      const pageIds = sales
                        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                        .map((s) => s.id);
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
                  ['saleNum', t.saleNumCol, ''],
                  ['date', t.dateCol, ''],
                  ['customer', t.customerCol, ''],
                  ['supplier', t.supplierCol, ''],
                  ['vehicle', t.vehicleCol, ''],
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
                        textAlign: ['netAmt', 'balance'].includes(key)
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
              {sales.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={10}>
                    <Text c="dimmed" ta="center" py="xl">
                      {t.noSalesFound}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                sales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((sale) => (
                  <Table.Tr key={sale.id} bg={selectedIds.has(sale.id) ? 'blue.0' : undefined}>
                    <Table.Td>
                      <Checkbox
                        checked={selectedIds.has(sale.id)}
                        onChange={(e) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            e.target.checked ? next.add(sale.id) : next.delete(sale.id);
                            return next;
                          });
                        }}
                      />
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      <Text fw={500}>{sale.sale_number}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {formatDisplayDate(sale.sale_date)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {sale.customer_name || '-'}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {sale.supplier_name || '-'}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      {sale.vehicle_number || '-'}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      Rs. {Math.round(sale.net_amount || 0).toLocaleString('en-US')}
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'left' : 'right', direction: 'ltr' }}>
                      <Text c={sale.balance_amount > 0 ? 'red' : 'green'}>
                        Rs. {Math.round(sale.balance_amount || 0).toLocaleString('en-US')}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: isUr ? 'right' : 'left' }}>
                      <Badge
                        color={sale.status === 'posted' ? 'green' : 'orange'}
                        variant="light"
                        size="sm"
                      >
                        {sale.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          color="blue"
                          variant="subtle"
                          onClick={() => onEdit?.(sale)}
                          title="Edit"
                        >
                          ✏️
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => handleDelete(sale)}
                          title="Delete"
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

        {/* Pagination */}
        {Math.ceil(sales.length / PAGE_SIZE) > 1 && (
          <Group justify="center" mt="sm">
            <Pagination
              total={Math.ceil(sales.length / PAGE_SIZE)}
              value={page}
              onChange={setPage}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

SaleSearch.propTypes = {
  onEdit: PropTypes.func,
};

export default SaleSearch;
