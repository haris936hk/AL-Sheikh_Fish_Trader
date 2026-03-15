import {
  Paper,
  Stack,
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
  Table,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import '@mantine/dates/styles.css';
import useStore from '../store';
import { formatDisplayName, formatDateForAPI } from '../utils/formatters';
import { validateRequired } from '../utils/validators';

const DEFAULT_LINE = {
  item_id: null,
  rate_per_maund: '',
  rate_kg: '',
  weight: '',
};

/**
 * PurchaseForm Component
 * Single-transaction purchase form: one item per purchase.
 * Implements FR-PURCH-001 through FR-PURCH-046.
 *
 * @param {Object} editPurchase - Purchase object to edit (null for new)
 * @param {function} onSaved - Callback after successful save
 * @param {function} onCancel - Callback to cancel/close form
 */
function PurchaseForm({ editPurchase, onSaved, onCancel }) {
  const language = useStore((s) => s.language);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [itemsList, setItemsList] = useState([]);

  const isUr = language === 'ur';
  const { t } = useTranslation();

  // Header fields
  const [purchaseNumber, setPurchaseNumber] = useState('00000');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [details, setDetails] = useState('');

  // Dynamic line items
  const [lineItems, setLineItems] = useState([{ ...DEFAULT_LINE }]);

  // Payment fields
  const [concessionAmount, setConcessionAmount] = useState('');
  const [cashPaid, setCashPaid] = useState('');

  // Supplier previous balance
  const [previousBalance, setPreviousBalance] = useState(0);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!window.api)
          throw new Error('Electron API not available. Please run the app via Electron.');
        const [suppliersRes, itemsRes, nextNumRes] = await Promise.all([
          window.api.suppliers.getAll(),
          window.api.items.getAll(),
          !editPurchase ? window.api.purchases.getNextNumber() : Promise.resolve(null),
        ]);

        if (suppliersRes.success) {
          setSuppliers(
            suppliersRes.data.map((s) => ({
              value: String(s.id),
              label: formatDisplayName(s.name, s.name_english, isUr),
              balance: s.current_balance || 0,
            }))
          );
        }

        if (itemsRes.success) {
          setItemsList(itemsRes.data);
        }

        if (nextNumRes?.success) {
          setPurchaseNumber(nextNumRes.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        notifications.show({
          title: t('error.title', 'Error'),
          message: `${t('error.loadFailed', 'Failed to load data')}: ${error.message || 'Unknown error'}`,
          color: 'red',
        });
      }
    };
    loadData();
  }, [editPurchase, isUr, t]);

  // Load existing purchase for editing
  useEffect(() => {
    if (editPurchase) {
      setPurchaseNumber(editPurchase.purchase_number);
      setPurchaseDate(new Date(editPurchase.purchase_date));
      setSelectedSupplier(String(editPurchase.supplier_id));
      setVehicleNumber(editPurchase.vehicle_number || '');
      setDetails(editPurchase.details || '');
      setConcessionAmount(editPurchase.concession_amount || '');
      setCashPaid(editPurchase.cash_paid || '');
      setPreviousBalance(editPurchase.previous_balance || 0);

      // Load line items
      if (editPurchase.items && editPurchase.items.length > 0) {
        setLineItems(
          editPurchase.items.map((item) => ({
            item_id: String(item.item_id),
            rate_per_maund: item.rate ? Number(item.rate) * 40 : '',
            rate_kg: Number(item.rate) || '',
            weight: Number(item.weight) || '',
          }))
        );
      } else {
        setLineItems([{ ...DEFAULT_LINE }]);
      }
    }
  }, [editPurchase]);

  // Line item operations
  const handleAddLine = useCallback(() => {
    setLineItems((prev) => [...prev, { ...DEFAULT_LINE }]);
  }, []);

  const handleRemoveLine = useCallback((index) => {
    setLineItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleLineChange = useCallback((index, field, value) => {
    setLineItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  }, []);

  const handleRateMaundChange = useCallback(
    (index, val) => {
      handleLineChange(index, 'rate_per_maund', val === '' ? '' : val);
      if (val !== '' && !isNaN(val)) {
        handleLineChange(index, 'rate_kg', val / 40);
      } else {
        handleLineChange(index, 'rate_kg', '');
      }
    },
    [handleLineChange]
  );

  const handleRateKgChange = useCallback(
    (index, val) => {
      handleLineChange(index, 'rate_kg', val === '' ? '' : val);
      if (val !== '' && !isNaN(val)) {
        handleLineChange(index, 'rate_per_maund', val * 40);
      } else {
        handleLineChange(index, 'rate_per_maund', '');
      }
    },
    [handleLineChange]
  );

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

  // Update previous balance when supplier changes (new purchase only)
  useEffect(() => {
    if (selectedSupplier && !editPurchase) {
      const supplier = suppliers.find((s) => s.value === selectedSupplier);
      setPreviousBalance(supplier?.balance || 0);
    }
  }, [selectedSupplier, suppliers, editPurchase]);

  // Items dropdown options
  const itemOptions = useMemo(
    () =>
      itemsList.map((item) => ({
        value: String(item.id),
        label: formatDisplayName(item.name, item.name_english, isUr),
      })),
    [itemsList, isUr]
  );

  // Calculated totals
  const totals = useMemo(() => {
    const numConcession = Number(concessionAmount) || 0;
    const numCash = Number(cashPaid) || 0;
    const numPrevBalance = Number(previousBalance) || 0;

    let grossAmount = 0;
    lineItems.forEach((row) => {
      const w = Number(row.weight) || 0;
      const r = Number(row.rate_kg) || 0;
      grossAmount += w * r;
    });

    const netAmount = grossAmount - numConcession;
    const balanceAmount = netAmount - numCash + numPrevBalance;
    return { grossAmount, netAmount, balanceAmount };
  }, [lineItems, concessionAmount, cashPaid, previousBalance]);

  // Format date for API
  const formatDate = (date) => formatDateForAPI(date);

  // Save purchase
  const handleSave = useCallback(async () => {
    const validLineItems = lineItems.filter(
      (row) => row.item_id || row.rate_kg || row.weight
    );

    if (validLineItems.length === 0) {
      notifications.show({ title: t('validation.title', 'Validation Error'), message: t('purchase.validationItem', 'Please add at least one item'), color: 'red' });
      return;
    }

    const supplierResult = validateRequired(selectedSupplier, t('purchase.supplier', 'Supplier'));
    if (!supplierResult.isValid) {
      notifications.show({
        title: t('validation.title', 'Validation Error'),
        message: t('validation.selectSupplier', 'Please select a vendor'),
        color: 'red',
      });
      return;
    }

    // Validate rows
    const hasInvalidRow = validLineItems.some(
      (row) => !row.item_id || Number(row.weight) <= 0 || Number(row.rate_kg) <= 0
    );

    if (hasInvalidRow) {
      notifications.show({
        title: t('validation.title', 'Validation Error'),
        message: t('purchase.validationWeightRate', 'Weight and rate must be greater than zero'),
        color: 'red',
      });
      return;
    }

    if (totals.grossAmount <= 0) {
      notifications.show({
        title: t('validation.title', 'Validation Error'),
        message: t('purchase.validationAmount', 'Gross amount must be greater than zero'),
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const purchaseData = {
        supplier_id: parseInt(selectedSupplier),
        vehicle_number: vehicleNumber || null,
        purchase_date: formatDate(purchaseDate),
        details: details || null,
        concession_amount: Number(concessionAmount) || 0,
        cash_paid: Number(cashPaid) || 0,
        items: validLineItems.map((row) => ({
          item_id: parseInt(row.item_id),
          weight: Number(row.weight) || 0,
          rate: Number(row.rate_kg) || 0,
          amount: (Number(row.weight) || 0) * (Number(row.rate_kg) || 0),
          notes: null,
        })),
      };

      let response;
      if (editPurchase) {
        response = await window.api.purchases.update(editPurchase.id, purchaseData);
      } else {
        response = await window.api.purchases.create(purchaseData);
      }

      if (response.success) {
        notifications.show({
          title: t('purchase.saved', 'Purchase Saved'),
          message: editPurchase
            ? t('purchase.updated', 'Purchase updated successfully')
            : (isUr ? `خریداری نمبر ${response.data.purchaseNumber} کامیابی سے محفوظ` : `Purchase ${response.data.purchaseNumber} created successfully`),
          color: 'green',
        });
        onSaved?.(response.data);
      } else {
        notifications.show({
          title: t('error.title', 'Error'),
          message: response.error || t('purchase.error', 'Failed to save purchase'),
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Save purchase error:', error);
      notifications.show({
        title: t('error.title', 'Error'),
        message: t('purchase.error', 'Failed to save purchase'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [
    selectedSupplier,
    vehicleNumber,
    purchaseDate,
    details,
    concessionAmount,
    cashPaid,
    lineItems,
    editPurchase,
    onSaved,
    t,
    isUr,
    totals.grossAmount,
  ]);

  // Print receipt
  const handlePrint = useCallback(() => {
    const supplierName = suppliers.find((s) => s.value === selectedSupplier)?.label || '';
    const dateStr = purchaseDate ? new Date(purchaseDate).toLocaleDateString('en-PK') : '';

    const validLines = lineItems.filter(row => row.item_id || row.rate_kg || row.weight);
    const rowsHtml = validLines.map((row) => {
      const itemInfo = itemsList.find((i) => String(i.id) === String(row.item_id));
      const w = Number(row.weight) || 0;
      const r = Number(row.rate_kg) || 0;
      const amt = w * r;
      return `
        <tr>
          <td>${itemInfo?.name || ''}</td>
          <td style="text-align:${isUr ? 'right' : 'left'}">${w.toFixed(2)}</td>
          <td style="text-align:${isUr ? 'right' : 'left'}">${r.toFixed(2)}</td>
          <td style="text-align:${isUr ? 'right' : 'left'}">${Math.round(amt).toLocaleString('en-US')}</td>
        </tr>
      `;
    }).join('');

    const html = `<!DOCTYPE html><html dir="${isUr ? 'rtl' : 'ltr'}"><head><title>${t('purchase.receiptTitle', 'Purchase Receipt')} - ${purchaseNumber}</title>
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
            <h2>AL-SHEIKH FISH TRADER AND DISTRIBUTER</h2>
            <p style="font-size:18px;direction:rtl">اے ایل شیخ فش ٹریڈر اینڈ ڈسٹری بیوٹر</p>
            <p>Shop No. W-644 Gunj Mandi Rawalpindi</p>
            <p>Ph: +92-3008501724 | 051-5534607</p>
            <h3 style="margin:10px 0 0">${t('purchase.receiptTitle', 'Purchase Receipt')}</h3>
        </div>
        <div class="info">
            <div><strong>${t('purchase.receiptNo', 'Receipt #')}:</strong> ${purchaseNumber}</div>
            <div><strong>${t('common.date', 'Date')}:</strong> ${dateStr}</div>
            <div><strong>${t('purchase.supplier', 'Vendor')}:</strong> ${supplierName}</div>
        </div>
        <table>
            <thead><tr><th style="text-align:${isUr ? 'right' : 'left'}">${t('purchase.item', 'Item')}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t('purchase.weight', 'Weight (kg)')}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t('purchase.rate', 'Rate')}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t('purchase.amount', 'Amount')}</th></tr></thead>
            <tbody>
              ${rowsHtml}
            </tbody>
        </table>
        <table class="totals">
            <tr><td>${t('purchase.grossAmount', 'Gross Amount')}:</td><td>Rs. ${Math.round(totals.grossAmount).toLocaleString('en-US')}</td></tr>
            <tr><td>${t('purchase.concession', 'Concession')}:</td><td>Rs. ${Math.round(concessionAmount || 0).toLocaleString('en-US')}</td></tr>
            <tr><td>${t('purchase.netAmount', 'Net Amount')}:</td><td><strong>Rs. ${Math.round(totals.netAmount).toLocaleString('en-US')}</strong></td></tr>
            <tr><td>${t('purchase.cashPaid', 'Cash Paid')}:</td><td>Rs. ${Math.round(cashPaid || 0).toLocaleString('en-US')}</td></tr>
            <tr class="grand-total"><td>${t('purchase.balanceDue', 'Balance Due')}:</td><td>Rs. ${Math.round(totals.balanceAmount).toLocaleString('en-US')}</td></tr>
        </table>
        </body></html>`;

    try {
      window.api.print.preview(html, {
        title: `${t('purchase.receiptTitle', 'Purchase Receipt')} - ${purchaseNumber}`,
        width: 1000,
        height: 800,
      });
    } catch (error) {
      console.error('Print error:', error);
      notifications.show({
        title: t('error.title', 'Error'),
        message: t('error.printFailed', 'Failed to open print preview'),
        color: 'red',
      });
    }
  }, [
    suppliers,
    selectedSupplier,
    purchaseDate,
    purchaseNumber,
    itemsList,
    lineItems,
    concessionAmount,
    cashPaid,
    totals,
    t,
    isUr,
  ]);

  // Clear form
  const handleClear = useCallback(() => {
    setSelectedSupplier(null);
    setVehicleNumber('');
    setDetails('');
    setLineItems([{ ...DEFAULT_LINE }]);
    setConcessionAmount('');
    setCashPaid('');
    setPreviousBalance(0);
  }, []);

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder pos="relative">
      <LoadingOverlay visible={loading} />

      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4} className="text-green-700">
            📦 {editPurchase ? t('purchase.edit', 'Edit Purchase') : t('purchase.addNew', 'New Purchase')}
          </Title>
          <Badge size="lg" variant="light" color="green">
            {purchaseNumber}
          </Badge>
        </Group>

        <Divider />

        {/* Header Fields */}
        <Grid>
          <Grid.Col span={4}>
            <DatePickerInput
              label={t('purchase.purchaseDate', 'Purchase Date')}
              placeholder=""
              value={purchaseDate}
              onChange={setPurchaseDate}
              maxDate={new Date()}
              required
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label={t('purchase.supplier', 'Vendor')}
              placeholder=""
              data={suppliers}
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              searchable
              required
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label={t('purchase.vehicleNo', 'Vehicle No')}
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
              label={t('purchase.details', 'Details')}
              placeholder=""
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              minRows={1}
              maxRows={2}
            />
          </Grid.Col>
        </Grid>

        <Divider label={t('purchase.lineItems', 'Line Items')} labelPosition="center" />

        {/* Dynamic Line Items - Tabular Layout */}
        <Paper withBorder radius="md" style={{ overflowX: 'auto' }}>
          <Table verticalSpacing="xs" striped withTableBorder withColumnBorders style={{ minWidth: 800 }}>
            <Table.Thead bg="gray.1">
              <Table.Tr>
                <Table.Th style={{ width: 220 }}>{t('purchase.item', 'Item')}</Table.Th>
                <Table.Th style={{ width: 100 }}>{t('purchase.rateMaund', 'Rate/Maund')}</Table.Th>
                <Table.Th style={{ width: 100 }}>{t('purchase.rate', 'Rate')}</Table.Th>
                <Table.Th style={{ width: 100 }}>{t('purchase.weight', 'Weight kg')}</Table.Th>
                <Table.Th style={{ width: 120 }}>{t('purchase.amount', 'Amount')}</Table.Th>
                {lineItems.length > 1 && <Table.Th style={{ width: 50, textAlign: 'center' }}>{t('app.delete', 'Delete')}</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lineItems.map((row, index) => {
                const rowLineAmount = (Number(row.weight) || 0) * (Number(row.rate_kg) || 0);

                return (
                  <Table.Tr key={index}>
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

                    {/* Rate/kg */}
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

                    {/* Amount */}
                    <Table.Td style={{ padding: '4px' }}>
                      <Text fw={700} size="sm" c="blue" dir="ltr" ta={isUr ? 'right' : 'left'}>
                        {Math.round(rowLineAmount).toLocaleString('en-US')}
                      </Text>
                    </Table.Td>

                    {/* Delete */}
                    {lineItems.length > 1 && (
                      <Table.Td style={{ textAlign: 'center', padding: '4px' }}>
                        <Tooltip label="Remove Line">
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => handleRemoveLine(index)}
                          >
                            ❌
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Paper>

        <Grid gutter="md">
          {/* Row 2: Concession + Cash Paid */}
          <Grid.Col span={4}>
            <NumberInput
              label={t('purchase.concession', 'Concession')}
              value={concessionAmount}
              onChange={(val) => setConcessionAmount(val === '' ? '' : val)}
              min={0}
              decimalScale={0}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t('purchase.cashPaid', 'Cash Paid')}
              value={cashPaid}
              onChange={(val) => setCashPaid(val === '' ? '' : val)}
              min={0}
              decimalScale={0}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Paper p="xs" radius="sm" withBorder style={{ background: '#fff' }}>
              <Text size="xs" c="dimmed" mb={2}>
                {t('purchase.previous', 'Previous Balance')}
              </Text>
              <Text
                fw={600}
                size="sm"
              >
                Rs. {Math.round(previousBalance).toLocaleString('en-US')}
              </Text>
            </Paper>
          </Grid.Col>
        </Grid>

        <Divider label={t('purchase.summary', 'Summary')} labelPosition="center" />

        {/* Summary */}
        <Paper
          p="md"
          radius="sm"
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #86efac',
          }}
        >
          <Grid gutter="sm">
            <Grid.Col span={4}>
              <Paper p="xs" radius="sm" withBorder style={{ background: '#fff' }}>
                <Text size="xs" c="dimmed" mb={2}>
                  {t('purchase.grossAmount', 'Gross Amount')}
                </Text>
                <Text
                  fw={600}
                  size="sm"
                >
                  Rs. {Math.round(totals.grossAmount).toLocaleString('en-US')}
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={4}>
              <Paper p="xs" radius="sm" withBorder style={{ background: '#eff6ff' }}>
                <Text size="xs" c="dimmed" mb={2}>
                  {t('purchase.netAmount', 'Net Amount')}
                </Text>
                <Text
                  fw={700}
                  size="md"
                  c="green"
                >
                  Rs. {Math.round(totals.netAmount).toLocaleString('en-US')}
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={4}>
              <Paper
                p="xs"
                radius="sm"
                withBorder
                style={{
                  background: totals.balanceAmount > 0 ? '#fef2f2' : '#f0fdf4',
                  borderColor: totals.balanceAmount > 0 ? '#fca5a5' : '#86efac',
                }}
              >
                <Text size="xs" c="dimmed" mb={2}>
                  {t('purchase.balanceDue', 'Balance Due')}
                </Text>
                <Text
                  fw={700}
                  size="md"
                  c={totals.balanceAmount > 0 ? 'red' : 'green'}
                >
                  Rs. {Math.round(totals.balanceAmount).toLocaleString('en-US')}
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md">
          {editPurchase && (
            <Button variant="light" color="teal" onClick={handlePrint}>
              🖨️ {t('purchase.printReceipt', 'Print Receipt')}
            </Button>
          )}
          <Button variant="light" color="gray" onClick={onCancel || handleClear}>
            {onCancel ? t('app.cancel', 'Cancel') : t('app.clear', 'Clear')}
          </Button>
          <Button variant="filled" color="green" onClick={handleSave}>
            {editPurchase ? t('purchase.updatePurchase', 'Update Purchase') : t('purchase.savePurchase', 'Save Purchase')}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

PurchaseForm.propTypes = {
  editPurchase: PropTypes.object,
  onSaved: PropTypes.func,
  onCancel: PropTypes.func,
};

export default PurchaseForm;
