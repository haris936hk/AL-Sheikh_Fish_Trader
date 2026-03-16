import {
  Paper,
  Group,
  Text,
  Title,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Button,
  LoadingOverlay,
  Divider,
  Grid,
  Badge,
  Checkbox,
  ActionIcon,
  Tooltip,
  Table,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import '@mantine/dates/styles.css';
import useStore from '../store';
import { formatDisplayName, formatDateForAPI } from '../utils/formatters';

const DEFAULT_LINE = {
  item_id: null,
  customer_id: null,
  is_stock: false,
  rate_per_maund: '',
  rate_kg: '',
  weight: '',
  ice_charges: '',
  fare_charges: '',
  cash_amount: '',
  receipt_amount: '',
};

/**
 * SaleForm Component
 * Multi-transaction sale form supporting multiple line items.
 * Implements FR-SALE-001 through FR-SALE-055.
 *
 * @param {Object} editSale - Sale object to edit (null for new)
 * @param {function} onSaved - Callback after successful save
 * @param {function} onCancel - Callback to cancel/close form
 */
function SaleForm({ editSale, onSaved, onCancel }) {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const settings = useStore((s) => s.settings);

  const isUr = language === 'ur';
  const { t } = useTranslation();

  // Header fields
  const [saleNumber, setSaleNumber] = useState('00000');
  const [saleDate, setSaleDate] = useState(new Date());
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [details, setDetails] = useState('');

  // Line items
  const [lineItems, setLineItems] = useState([{ ...DEFAULT_LINE }]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!window.api)
          throw new Error(t('error.unexpectedMsg'));
        const [customersRes, suppliersRes, itemsRes, nextNumRes] = await Promise.all([
          window.api.customers.getAll(),
          window.api.suppliers.getAll(),
          window.api.items.getAll(),
          !editSale ? window.api.sales.getNextNumber() : Promise.resolve(null),
        ]);

        if (customersRes.success) {
          setCustomers(
            customersRes.data.map((c) => ({
              value: String(c.id),
              label: formatDisplayName(c.name, c.name_english, isUr),
            }))
          );
        }

        if (suppliersRes.success) {
          setSuppliers(
            suppliersRes.data.map((s) => ({
              value: String(s.id),
              label: formatDisplayName(s.name, s.name_english, isUr),
            }))
          );
        }

        if (itemsRes.success) {
          // We filter out deleted items or keep all so we don't break old sales if not fully handled by backend
          setItemsList(itemsRes.data);
        }

        if (nextNumRes?.success) {
          setSaleNumber(nextNumRes.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        notifications.show({
          title: t('error.title'),
          message: `${t('error.loadFailed')}: ${error.message || t('error.unexpected')}`,
          color: 'red',
        });
      }
    };
    loadData();
  }, [editSale, isUr, t]);

  // Load existing sale for editing
  useEffect(() => {
    if (editSale) {
      setSaleNumber(editSale.sale_number);
      setSaleDate(new Date(editSale.sale_date));
      setSelectedSupplier(editSale.supplier_id ? String(editSale.supplier_id) : null);
      setVehicleNumber(editSale.vehicle_number || '');
      setDetails(editSale.details || '');

      if (editSale.items && editSale.items.length > 0) {
        setLineItems(
          editSale.items.map((item) => ({
            item_id: String(item.item_id),
            customer_id: item.customer_id ? String(item.customer_id) : null,
            is_stock: !!item.is_stock,
            rate_per_maund: item.rate_per_maund || '',
            rate_kg: item.rate || '',
            weight: item.weight || '',
            ice_charges: item.ice_charges || '',
            fare_charges: item.fare_charges || '',
            cash_amount: item.cash_amount || '',
            receipt_amount: item.receipt_amount || '',
          }))
        );
      }
    }
  }, [editSale]);

  const itemOptions = useMemo(
    () =>
      itemsList.map((item) => ({
        value: String(item.id),
        label: formatDisplayName(item.name, item.name_english, isUr),
      })),
    [itemsList, isUr]
  );

  // Row handlers
  const handleAddLine = useCallback(() => {
    setLineItems((prev) => [...prev, { ...DEFAULT_LINE }]);
  }, []);

  const handleRemoveLine = useCallback((index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleLineChange = useCallback((index, field, value) => {
    setLineItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  }, []);

  // Dual-rate sync: 1 Maund = 40 kg
  const handleRateMaundChange = useCallback((index, val) => {
    setLineItems((prev) => {
      const newItems = [...prev];
      if (val === '') {
        newItems[index].rate_per_maund = '';
        newItems[index].rate_kg = '';
      } else {
        const v = Number(val) || 0;
        newItems[index].rate_per_maund = v;
        newItems[index].rate_kg = v / 40;
      }
      return newItems;
    });
  }, []);

  const handleRateKgChange = useCallback((index, val) => {
    setLineItems((prev) => {
      const newItems = [...prev];
      if (val === '') {
        newItems[index].rate_kg = '';
        newItems[index].rate_per_maund = '';
      } else {
        const v = Number(val) || 0;
        newItems[index].rate_kg = v;
        newItems[index].rate_per_maund = v * 40;
      }
      return newItems;
    });
  }, []);

  // Auto-add line when the last row is filled
  useEffect(() => {
    if (lineItems.length === 0) return;
    const lastRow = lineItems[lineItems.length - 1];

    // A row is considered "filled" if it has an item, a rate, and a weight
    if (
      lastRow.item_id &&
      lastRow.rate_kg !== '' && Number(lastRow.rate_kg) > 0 &&
      lastRow.weight !== '' && Number(lastRow.weight) > 0
    ) {
      handleAddLine();
    }
  }, [lineItems, handleAddLine]);

  // Calculated totals across all line items
  const totals = useMemo(() => {
    return lineItems.reduce(
      (acc, row) => {
        const w = Number(row.weight) || 0;
        const r = Number(row.rate_kg) || 0;
        const fc = Number(row.fare_charges) || 0;
        const ic = Number(row.ice_charges) || 0;
        const ca = Number(row.cash_amount) || 0;
        const ra = Number(row.receipt_amount) || 0;

        const lineAmount = w * r;
        acc.grossAmount += lineAmount;
        acc.fareCharges += fc;
        acc.iceCharges += ic;
        acc.netAmount += lineAmount + fc + ic;
        acc.cashReceived += ca;
        acc.receiptAmount += ra;
        return acc;
      },
      {
        grossAmount: 0,
        fareCharges: 0,
        iceCharges: 0,
        netAmount: 0,
        cashReceived: 0,
        receiptAmount: 0,
      }
    );
  }, [lineItems]);

  const balanceAmount = totals.netAmount - totals.cashReceived - totals.receiptAmount;

  // Format date for API
  const formatDate = (date) => formatDateForAPI(date);

  // Save sale
  const handleSave = useCallback(async () => {
    const validLineItems = lineItems.filter(
      (row) => row.item_id || row.rate_kg || row.weight || row.customer_id
    );

    if (validLineItems.length === 0) {
      notifications.show({ title: t('error.title'), message: t('validation.addItem'), color: 'red' });
      return;
    }

    // Validate all rows
    for (let i = 0; i < validLineItems.length; i++) {
      const row = validLineItems[i];
      if (!row.item_id) {
        notifications.show({ title: t('error.title'), message: t('validation.required', { field: t('sale.item') }), color: 'red' });
        return;
      }
      if (!row.customer_id) {
        notifications.show({ title: t('error.title'), message: t('validation.required', { field: t('sale.customer') }), color: 'red' });
        return;
      }
      if (Number(row.weight) <= 0 || Number(row.rate_kg) <= 0) {
        notifications.show({ title: t('error.title'), message: t('validation.greaterThanZero', { field: `${t('sale.weightKg')} / ${t('sale.rateKg')}` }), color: 'red' });
        return;
      }
    }

    // Stock availability check
    try {
      const stockResult = await window.api.items.getAll();
      if (stockResult.success) {
        const stockMap = {};
        stockResult.data.forEach((item) => {
          stockMap[String(item.id)] = { stock: item.current_stock || 0, name: item.name };
        });

        // Add back existing sale weight to map if we are editing
        if (editSale?.items) {
          for (const existingItem of editSale.items) {
            const key = String(existingItem.item_id);
            if (existingItem.is_stock && stockMap[key]) {
              stockMap[key].stock += existingItem.weight || 0;
            }
          }
        }

        // Compute required weight from all selected line items
        const requiredWeightMap = {};
        for (const row of validLineItems) {
          if (row.is_stock && row.item_id) {
            const w = Number(row.weight) || 0;
            requiredWeightMap[row.item_id] = (requiredWeightMap[row.item_id] || 0) + w;
          }
        }

        // Validate vs available
        for (const [itemId, needWeight] of Object.entries(requiredWeightMap)) {
          const stockInfo = stockMap[itemId];
          if (stockInfo && needWeight > stockInfo.stock) {
            notifications.show({
              title: t('validation.insufficientStock'),
              message: t('sale.insufficientStockMsg', {
                name: stockInfo.name,
                need: needWeight.toFixed(2),
                avail: stockInfo.stock.toFixed(2),
              }),
              color: 'red',
              autoClose: 8000,
            });
            return;
          }
        }
      }
    } catch (error) {
      console.error('Stock check error:', error);
      notifications.show({ title: t('error.title'), message: t('error.saveFailed'), color: 'red' });
      return;
    }

    setLoading(true);
    try {
      // Backend automatically calculates per-customer totals from items array.
      // We pass the first customer_id as the header customer_id per existing pattern
      // since the database sales table has a customer_id column.
      const primaryCustomerId = validLineItems.length > 0 ? parseInt(validLineItems[0].customer_id) : null;

      const saleData = {
        customer_id: primaryCustomerId,
        supplier_id: selectedSupplier ? parseInt(selectedSupplier) : null,
        vehicle_number: vehicleNumber || null,
        sale_date: formatDate(saleDate),
        details: details || null,
        items: validLineItems.map((row) => ({
          item_id: parseInt(row.item_id),
          customer_id: parseInt(row.customer_id),
          is_stock: row.is_stock,
          rate_per_maund: row.rate_per_maund || 0,
          rate: row.rate_kg || 0,
          weight: row.weight || 0,
          fare_charges: row.fare_charges || 0,
          ice_charges: row.ice_charges || 0,
          cash_amount: row.cash_amount || 0,
          receipt_amount: row.receipt_amount || 0,
          notes: null,
        })),
      };

      let response;
      if (editSale) {
        response = await window.api.sales.update(editSale.id, saleData);
      } else {
        response = await window.api.sales.create(saleData);
      }

      if (response.success) {
        notifications.show({
          title: t('app.saved'),
          message: editSale ? t('sale.updated') : t('sale.savedNum', { num: response.data.saleNumber }),
          color: 'green',
        });
        onSaved?.(response.data);
      } else {
        notifications.show({
          title: t('error.title'),
          message: response.error || t('error.saveFailed'),
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Save sale error:', error);
      notifications.show({ title: t('error.title'), message: t('error.saveFailed'), color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [
    details,
    editSale,
    lineItems,
    onSaved,
    saleDate,
    selectedSupplier,
    t,
    vehicleNumber,
  ]);

  // Print receipt for saved sale
  const handlePrint = useCallback(() => {
    const dateStr = saleDate ? new Date(saleDate).toLocaleDateString('en-PK') : '';
    const companyName = settings.company_name || 'AL-Sheikh Traders and Distributors';
    const companyAddress = isUr ? (settings.company_address_urdu || settings.company_address) : (settings.company_address || 'Shop No. W-644 Gunj Mandi Rawalpindi');
    const companyPhone = settings.company_phone || '+92-3008501724 | 051-5534607';

    const validLines = lineItems.filter(row => row.item_id || row.rate_kg || row.weight || row.customer_id);
    const rowsHtml = validLines.map((row) => {
      const itemInfo = itemsList.find((i) => String(i.id) === String(row.item_id));
      const custInfo = customers.find((c) => c.value === String(row.customer_id));
      const numWeight = Number(row.weight) || 0;
      const numRateKg = Number(row.rate_kg) || 0;
      const numFare = Number(row.fare_charges) || 0;
      const numIce = Number(row.ice_charges) || 0;
      const totalAmount = Math.round((numWeight * numRateKg) + numFare + numIce);

      return `<tr>
        <td style="text-align:${isUr ? 'right' : 'left'}">${itemInfo?.name || ''}</td>
        <td style="text-align:${isUr ? 'right' : 'left'}">${custInfo?.label || ''}</td>
        <td style="text-align:${isUr ? 'right' : 'left'}">${numWeight.toFixed(2)}</td>
        <td style="text-align:${isUr ? 'right' : 'left'}">${numRateKg.toFixed(2)}</td>
        <td style="text-align:${isUr ? 'right' : 'left'}">${totalAmount.toLocaleString('en-US')}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html dir="${isUr ? 'rtl' : 'ltr'}"><head><title>${t('sale.receiptTitle')} - ${saleNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet" />
        <style>
            @page { margin: 1cm; }
            body { font-family: 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 20px; color: #333; direction: ${isUr ? 'rtl' : 'ltr'}; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
            .header h2 { margin: 0; } .header p { margin: 3px 0; font-size: 12px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
            th { background: #f5f5f5; text-align: ${isUr ? 'right' : 'left'}; }
            .totals { text-align: ${isUr ? 'right' : 'left'}; font-size: 13px; }
            .totals td { border: none; padding: 3px 8px; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #333 !important; }
            @media print { body { padding: 0; } }
        </style></head><body>
        <div class="header">
            <h2>${companyName}</h2>
            <p>${companyAddress}</p>
            <p>Ph: ${companyPhone}</p>
            <h3 style="margin:10px 0 0">${t('sale.receiptTitle')}</h3>
        </div>
        <div class="info">
            <div><strong>${t('sale.receiptNo', 'Receipt #')}:</strong> ${saleNumber}</div>
            <div><strong>${t('common.date', 'Date')}:</strong> ${dateStr}</div>
        </div>
        <table>
            <thead><tr><th style="text-align:${isUr ? 'right' : 'left'}">${t('sale.item', 'Item')}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t('sale.customer', 'Customer')}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t('sale.weightKg', 'Weight kg')}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t('sale.rateKg', 'Rate/kg')}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t('sale.totalAmount', 'Total Amount')}</th></tr></thead>
            <tbody>
              ${rowsHtml}
            </tbody>
        </table>
        <table class="totals">
            <tr><td>${t('sale.grossAmount', 'Gross Amount')}:</td><td>Rs. ${Math.round(totals.grossAmount).toLocaleString('en-US')}</td></tr>
            <tr><td>${t('sale.fareCharges', 'Fare Charges')}:</td><td>Rs. ${Math.round(totals.fareCharges).toLocaleString('en-US')}</td></tr>
            <tr><td>${t('sale.iceCharges', 'Ice Charges')}:</td><td>Rs. ${Math.round(totals.iceCharges).toLocaleString('en-US')}</td></tr>
            <tr><td>${t('sale.netAmount', 'Net Amount')}:</td><td><strong>Rs. ${Math.round(totals.netAmount).toLocaleString('en-US')}</strong></td></tr>
            <tr><td>${t('sale.cash', 'Cash')}:</td><td>Rs. ${Math.round(totals.cashReceived).toLocaleString('en-US')}</td></tr>
            <tr class="grand-total"><td>${t('sale.balance', 'Balance')}:</td><td>Rs. ${Math.round(balanceAmount).toLocaleString('en-US')}</td></tr>
        </table>
        </body></html>`;

    try {
      window.api.print.preview(html, {
        title: `${t('sale.receiptTitle', 'Sale Receipt')} - ${saleNumber}`,
        width: 1000,
        height: 800,
      });
    } catch (error) {
      console.error('Print error:', error);
      notifications.show({ title: t('error.title'), message: t('error.printFailed'), color: 'red' });
    }
  }, [
    balanceAmount,
    customers,
    isUr,
    itemsList,
    lineItems,
    saleDate,
    saleNumber,
    settings.company_address,
    settings.company_address_urdu,
    settings.company_name,
    settings.company_phone,
    t,
    totals,
  ]);

  // Clear form
  const handleClear = useCallback(() => {
    setSelectedSupplier(null);
    setVehicleNumber('');
    setDetails('');
    setLineItems([{ ...DEFAULT_LINE }]);
  }, []);

  return (
    <Paper shadow="sm" p="sm" radius="md" withBorder pos="relative" className="h-full flex flex-col overflow-hidden">
      <LoadingOverlay visible={loading} />

      <div className="flex-none flex flex-col gap-3">
        <Group justify="space-between" align="center">
          <Title order={4} className="m-0">
            {t(editSale ? 'sale.edit' : 'sale.addNew')}
          </Title>
          <Badge size="lg" variant="light" color="blue">
            {saleNumber}
          </Badge>
        </Group>

        <Divider />

        {/* Header Fields */}
        <Grid>
          <Grid.Col span={4}>
            <DatePickerInput
              label={t('sale.saleDate', 'Sale Date')}
              placeholder=""
              value={saleDate}
              onChange={setSaleDate}
              maxDate={new Date()}
              required
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label={t('sale.supplier')}
                placeholder={t('sale.selectSupplierPh')}
                data={suppliers}
                value={selectedSupplier}
                onChange={setSelectedSupplier}
                searchable
                clearable
                nothingFoundMessage={t('supplier.noResults')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label={t('sale.vehicleNo', 'Vehicle No')}
              placeholder=""
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="ltr-field"
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={12}>
            <Textarea
              label={t('sale.details', 'Details')}
              placeholder={t('sale.detailsPh')}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              autosize
              minRows={2}
            />
          </Grid.Col>
        </Grid>

        <Divider label={t('sale.lineItems', 'Line Items')} labelPosition="center" />
      </div>

      {/* Dynamic Line Items - Tabular Layout */}
      <div className="flex-1 overflow-hidden min-h-0 relative mt-2 border border-gray-200 dark:border-gray-700 rounded-md">
        <div className="h-full overflow-y-auto overflow-x-auto">
          <Table verticalSpacing="xs" striped withTableBorder withColumnBorders style={{ minWidth: 950 }}>
            <Table.Thead bg="gray.1">
              <Table.Tr>
                <Table.Th style={{ width: 40, textAlign: 'center' }}>{t('sale.stock')}</Table.Th>
                <Table.Th style={{ width: 170 }}>{t('sale.item')}</Table.Th>
                <Table.Th style={{ width: 85 }}>{t('sale.rateMaund')}</Table.Th>
                <Table.Th style={{ width: 85 }}>{t('sale.rateKg')}</Table.Th>
                <Table.Th style={{ width: 170 }}>{t('sale.customer')}</Table.Th>
                <Table.Th style={{ width: 80 }}>{t('sale.weightKg')}</Table.Th>
                <Table.Th style={{ width: 70 }}>{t('sale.iceCharges')}</Table.Th>
                <Table.Th style={{ width: 70 }}>{t('sale.fareCharges')}</Table.Th>
                <Table.Th style={{ width: 90 }}>{t('sale.totalAmount')}</Table.Th>
                <Table.Th style={{ width: 80 }}>{t('sale.cash')}</Table.Th>
                <Table.Th style={{ width: 80 }}>{t('sale.receipt')}</Table.Th>
                {lineItems.length > 1 && <Table.Th style={{ width: 40, textAlign: 'center' }}>X</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lineItems.map((row, index) => {
                const rowLineAmount = (Number(row.weight) || 0) * (Number(row.rate_kg) || 0);
                const rowNetAmount = rowLineAmount + (Number(row.fare_charges) || 0) + (Number(row.ice_charges) || 0);

                return (
                  <Table.Tr key={index}>
                    {/* Stock */}
                    <Table.Td style={{ textAlign: 'center', padding: '4px' }}>
                      <Checkbox
                        checked={row.is_stock}
                        onChange={(e) => handleLineChange(index, 'is_stock', e.currentTarget.checked)}
                        size="sm"
                      />
                    </Table.Td>

                    {/* Item */}
                    <Table.Td style={{ padding: '4px' }}>
                      <Select
                        placeholder=""
                        data={itemOptions}
                        value={row.item_id}
                        onChange={(val) => handleLineChange(index, 'item_id', val)}
                        searchable
                        required
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>

                    {/* Rate/Maund */}
                    <Table.Td style={{ padding: '4px' }}>
                      <NumberInput
                        value={row.rate_per_maund}
                        onChange={(val) => handleRateMaundChange(index, val)}
                        min={0}
                        decimalScale={2}
                        hideControls
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>

                    {/* Rate/Kg */}
                    <Table.Td style={{ padding: '4px' }}>
                      <NumberInput
                        value={row.rate_kg}
                        onChange={(val) => handleRateKgChange(index, val)}
                        min={0}
                        decimalScale={2}
                        hideControls
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>

                    {/* Customer */}
                    <Table.Td style={{ padding: '4px' }}>
                      <Select
                        placeholder=""
                        data={customers}
                        value={row.customer_id}
                        onChange={(val) => handleLineChange(index, 'customer_id', val)}
                        searchable
                        required
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>

                    {/* Weight */}
                    <Table.Td style={{ padding: '4px' }}>
                      <NumberInput
                        value={row.weight}
                        onChange={(val) => handleLineChange(index, 'weight', val === '' ? '' : val)}
                        min={0}
                        decimalScale={2}
                        hideControls
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>

                    {/* Ice */}
                    <Table.Td style={{ padding: '4px' }}>
                      <NumberInput
                        value={row.ice_charges}
                        onChange={(val) => handleLineChange(index, 'ice_charges', val === '' ? '' : val)}
                        min={0}
                        decimalScale={0}
                        hideControls
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>

                    {/* Fare */}
                    <Table.Td style={{ padding: '4px' }}>
                      <NumberInput
                        value={row.fare_charges}
                        onChange={(val) => handleLineChange(index, 'fare_charges', val === '' ? '' : val)}
                        min={0}
                        decimalScale={0}
                        hideControls
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>

                    {/* Total Amount */}
                    <Table.Td style={{ padding: '4px' }}>
                      <Text fw={700} size="sm" c="blue" dir="ltr" ta={isUr ? 'right' : 'left'}>
                        {Math.round(rowNetAmount).toLocaleString('en-US')}
                      </Text>
                    </Table.Td>

                    {/* Cash */}
                    <Table.Td style={{ padding: '4px' }}>
                      <NumberInput
                        value={row.cash_amount}
                        onChange={(val) => handleLineChange(index, 'cash_amount', val === '' ? '' : val)}
                        min={0}
                        decimalScale={0}
                        hideControls
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>

                    {/* Receipt */}
                    <Table.Td style={{ padding: '4px' }}>
                      <NumberInput
                        value={row.receipt_amount}
                        onChange={(val) => handleLineChange(index, 'receipt_amount', val === '' ? '' : val)}
                        min={0}
                        decimalScale={0}
                        hideControls
                        size="xs"
                        variant="unstyled"
                      />
                    </Table.Td>

                    {/* Delete */}
                    {lineItems.length > 1 && (
                      <Table.Td style={{ textAlign: 'center', padding: '4px' }}>
                          <Tooltip label={t('sale.removeLine')}>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => handleRemoveLine(index)}
                              disabled={lineItems.length === 1}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      <div className="flex-none mt-3">
        <Divider mb="xs" label={t('sale.summary', 'Summary')} labelPosition="center" />

        {/* Global Summary */}
        <Paper
          p="md"
          radius="sm"
          style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
            direction: isUr ? 'rtl' : 'ltr',
          }}
        >
          {/* Row 1: amounts */}
          <Grid mb="xs" gutter="sm">
            {[
              {
                label: t('sale.grossAmount'),
                val: `${Math.round(totals.grossAmount).toLocaleString('en-US')}`,
                color: 'dark',
              },
              {
                label: t('sale.charges'),
                val: `${Math.round(totals.fareCharges + totals.iceCharges).toLocaleString('en-US')}`,
                color: 'dark',
              },
              {
                label: t('sale.netAmount'),
                val: `${Math.round(totals.netAmount).toLocaleString('en-US')}`,
                color: 'blue',
              },
            ].map(({ label, val, color }, idx) => (
              <Grid.Col key={idx} span={4}>
                <Paper p="xs" radius="sm" withBorder style={{ background: '#fff' }}>
                  <Text size="xs" c="dimmed" mb={2}>
                    {label}
                  </Text>
                  <Text fw={700} size="sm" c={color} dir="ltr" ta={isUr ? 'right' : 'left'}>
                    {val}
                  </Text>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>

          {/* Row 2: received + balance */}
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Paper p="xs" radius="sm" withBorder style={{ background: '#fff' }}>
                <Text size="xs" c="dimmed" mb={2}>
                  {t('sale.cashReceipt', 'Cash + Receipt')}
                </Text>
                <Text fw={600} size="sm" dir="ltr" ta={isUr ? 'right' : 'left'}>
                  Rs. {Math.round(totals.cashReceived + totals.receiptAmount).toLocaleString('en-US')}
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={6}>
              <Paper
                p="xs"
                radius="sm"
                withBorder
                style={{
                  background: balanceAmount > 0 ? '#fef2f2' : '#f0fdf4',
                  borderColor: balanceAmount > 0 ? '#fca5a5' : '#86efac',
                }}
              >
                <Text size="xs" c="dimmed" mb={2}>
                  {t('sale.balance', 'Balance')}
                </Text>
                <Text
                  fw={700}
                  size="md"
                  c={balanceAmount > 0 ? 'red' : 'green'}
                  dir="ltr"
                  ta={isUr ? 'right' : 'left'}
                >
                  Rs. {Math.round(balanceAmount).toLocaleString('en-US')}
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        <Group justify="flex-end" mt="sm">
          <Button
            leftSection={<IconPlus size={16} />}
            variant="light"
            onClick={handleAddLine}
          >
            {t('sale.addLine')}
          </Button>
          {editSale && (
            <Button variant="light" color="teal" onClick={handlePrint}>
              🖨️ {t('sale.printReceipt', 'Print Receipt')}
            </Button>
          )}
          <Button variant="light" color="gray" onClick={onCancel || handleClear}>
            {onCancel ? t('app.cancel', 'Cancel') : t('app.clear', 'Clear')}
          </Button>
          <Button variant="filled" color="blue" onClick={handleSave}>
            {t(editSale ? 'sale.updateSale' : 'sale.saveSale')}
          </Button>
        </Group>
      </div>
    </Paper>
  );
}

SaleForm.propTypes = {
  editSale: PropTypes.object,
  onSaved: PropTypes.func,
  onCancel: PropTypes.func,
};

export default SaleForm;
