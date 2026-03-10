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

import '@mantine/dates/styles.css';
import useStore from '../store';
import { formatDisplayName } from '../utils/formatters';
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
  const t = useMemo(
    () => ({
      title: editPurchase
        ? isUr
          ? 'خریداری ترمیم کریں'
          : 'Edit Purchase'
        : isUr
          ? 'نئی خریداری'
          : 'New Purchase',
      purchaseDate: isUr ? 'خریداری تاریخ' : 'Purchase Date',
      supplier: isUr ? 'بیوپاری' : 'Supplier',
      vehicleNo: isUr ? 'گاڑی نمبر' : 'Vehicle No',
      details: isUr ? 'تفصیل' : 'Details',
      purchaseDetails: isUr ? 'خریداری تفصیل' : 'Purchase Details',
      item: isUr ? 'قسم' : 'Item',
      rate: isUr ? 'ریٹ' : 'Rate/kg',
      weight: isUr ? 'وزن کلوگرام' : 'Weight kg',
      amount: isUr ? 'رقم' : 'Amount',
      concession: isUr ? 'رعایت' : 'Concession',
      cashPaid: isUr ? 'نقد ادا' : 'Cash Paid',
      prevBalance: isUr ? 'سابقہ بقایا' : 'Previous Balance',
      summary: isUr ? 'خلاصہ' : 'Summary',
      grossAmount: isUr ? 'مجموعی رقم' : 'Gross Amount',
      netAmount: isUr ? 'خالص رقم' : 'Net Amount',
      balanceDue: isUr ? 'ادائیگی رقم' : 'Balance Due',
      printReceipt: isUr ? 'رسید پرنٹ کریں' : 'Print Receipt',
      cancel: isUr ? 'منسوخ' : 'Cancel',
      clear: isUr ? 'صاف کریں' : 'Clear',
      updatePurchase: isUr ? 'خریداری اپ ڈیٹ کریں' : 'Update Purchase',
      savePurchase: isUr ? 'خریداری محفوظ کریں' : 'Save Purchase',
      valErrorTitle: isUr ? 'توثیق کی خرابی' : 'Validation Error',
      selectSupplierMsg: isUr ? 'براہ کرم بیوپاری منتخب کریں' : 'Please select a supplier',
      selectItemMsg: isUr ? 'براہ کرم آئٹم (قسم) منتخب کریں' : 'Please select an item',
      valErrorWeightRate: isUr ? 'وزن اور ریٹ صفر سے زیادہ ہونا چاہیے' : 'Weight and rate must be greater than zero',
      valErrorAmount: isUr ? 'مجموعی رقم صفر سے زیادہ ہونی چاہیے' : 'Gross amount must be greater than zero',
      saveSuccessTitle: isUr ? 'خریداری محفوظ' : 'Purchase Saved',
      updateSuccessMsg: isUr ? 'خریداری کامیابی سے اپ ڈیٹ ہو گئی' : 'Purchase updated successfully',
      createSuccessMsg: (num) =>
        isUr ? `خریداری نمبر ${num} کامیابی سے محفوظ` : `Purchase ${num} created successfully`,
      saveErrorTitle: isUr ? 'خرابی' : 'Error',
      saveErrorMsg: isUr ? 'خریداری محفوظ کرنے میں خرابی' : 'Failed to save purchase',
      loadErrorMsg: isUr ? 'فارم ڈیٹا لوڈ کرنے میں خرابی' : 'Failed to load form data',
      printErrorTitle: isUr ? 'پرنٹ کی خرابی' : 'Print Error',
      printErrorMsg: isUr ? 'پرنٹ پیش نظارہ کھولنے میں خرابی' : 'Failed to open print preview',
      receiptTitle: isUr ? 'خریداری رسید' : 'Purchase Receipt',
      receiptNo: isUr ? 'رسید نمبر' : 'Receipt #',
      date: isUr ? 'تاریخ' : 'Date',
    }),
    [isUr, editPurchase]
  );

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
          title: t.saveErrorTitle,
          message: `${t.loadErrorMsg}: ${error.message || 'Unknown error'}`,
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
  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
  };

  // Save purchase
  const handleSave = useCallback(async () => {
    const supplierResult = validateRequired(selectedSupplier, t.supplier);
    if (!supplierResult.isValid) {
      notifications.show({
        title: t.valErrorTitle,
        message: t.selectSupplierMsg,
        color: 'red',
      });
      return;
    }

    // Validate rows
    const hasInvalidRow = lineItems.some(
      (row) => !row.item_id || Number(row.weight) <= 0 || Number(row.rate_kg) <= 0
    );

    if (hasInvalidRow) {
      notifications.show({
        title: t.valErrorTitle,
        message: t.valErrorWeightRate,
        color: 'red',
      });
      return;
    }

    if (totals.grossAmount <= 0) {
      notifications.show({
        title: t.valErrorTitle,
        message: t.valErrorAmount,
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
        items: lineItems.map((row) => ({
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
          title: t.saveSuccessTitle,
          message: editPurchase
            ? t.updateSuccessMsg
            : t.createSuccessMsg(response.data.purchaseNumber),
          color: 'green',
        });
        onSaved?.(response.data);
      } else {
        notifications.show({
          title: t.saveErrorTitle,
          message: response.error || t.saveErrorMsg,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Save purchase error:', error);
      notifications.show({
        title: t.saveErrorTitle,
        message: t.saveErrorMsg,
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
    totals.grossAmount,
  ]);

  // Print receipt
  const handlePrint = useCallback(() => {
    const supplierName = suppliers.find((s) => s.value === selectedSupplier)?.label || '';
    const dateStr = purchaseDate ? new Date(purchaseDate).toLocaleDateString('en-PK') : '';

    const rowsHtml = lineItems.map((row) => {
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

    const html = `<!DOCTYPE html><html dir="${isUr ? 'rtl' : 'ltr'}"><head><title>${t.receiptTitle} - ${purchaseNumber}</title>
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
            <h3 style="margin:10px 0 0">${t.receiptTitle}</h3>
        </div>
        <div class="info">
            <div><strong>${t.receiptNo}:</strong> ${purchaseNumber}</div>
            <div><strong>${t.date}:</strong> ${dateStr}</div>
            <div><strong>${t.supplier}:</strong> ${supplierName}</div>
        </div>
        <table>
            <thead><tr><th style="text-align:${isUr ? 'right' : 'left'}">${t.item}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t.weight}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t.rate}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t.amount}</th></tr></thead>
            <tbody>
              ${rowsHtml}
            </tbody>
        </table>
        <table class="totals">
            <tr><td>${t.grossAmount}:</td><td>Rs. ${Math.round(totals.grossAmount).toLocaleString('en-US')}</td></tr>
            <tr><td>${t.concession}:</td><td>Rs. ${Math.round(concessionAmount || 0).toLocaleString('en-US')}</td></tr>
            <tr><td>${t.netAmount}:</td><td><strong>Rs. ${Math.round(totals.netAmount).toLocaleString('en-US')}</strong></td></tr>
            <tr><td>${t.cashPaid}:</td><td>Rs. ${Math.round(cashPaid || 0).toLocaleString('en-US')}</td></tr>
            <tr class="grand-total"><td>${t.balanceDue}:</td><td>Rs. ${Math.round(totals.balanceAmount).toLocaleString('en-US')}</td></tr>
        </table>
        </body></html>`;

    try {
      window.api.print.preview(html, {
        title: `${t.receiptTitle} - ${purchaseNumber}`,
        width: 1000,
        height: 800,
      });
    } catch (error) {
      console.error('Print error:', error);
      notifications.show({
        title: t.printErrorTitle,
        message: t.printErrorMsg,
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
            📦 {t.title}
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
              label={t.purchaseDate}
              placeholder=""
              value={purchaseDate}
              onChange={setPurchaseDate}
              maxDate={new Date()}
              required
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label={t.supplier}
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
              label={t.vehicleNo}
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
              label={t.details}
              placeholder=""
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              minRows={1}
              maxRows={2}
            />
          </Grid.Col>
        </Grid>

        <Divider label={t.purchaseDetails} labelPosition="center" />

        {/* Dynamic Line Items - Tabular Layout */}
        <Paper withBorder radius="md" style={{ overflowX: 'auto' }}>
          <Table verticalSpacing="xs" striped withTableBorder withColumnBorders style={{ minWidth: 800 }}>
            <Table.Thead bg="gray.1">
              <Table.Tr>
                <Table.Th style={{ width: 220 }}>{t.item}</Table.Th>
                <Table.Th style={{ width: 100 }}>{t.rateMaund}</Table.Th>
                <Table.Th style={{ width: 100 }}>{t.rate}</Table.Th>
                <Table.Th style={{ width: 100 }}>{t.weight}</Table.Th>
                <Table.Th style={{ width: 120 }}>{t.amount}</Table.Th>
                {lineItems.length > 1 && <Table.Th style={{ width: 50, textAlign: 'center' }}>Delete</Table.Th>}
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
              label={t.concession}
              value={concessionAmount}
              onChange={(val) => setConcessionAmount(val === '' ? '' : val)}
              min={0}
              decimalScale={0}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t.cashPaid}
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
                {t.prevBalance}
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

        <Divider label={t.summary} labelPosition="center" />

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
                  {t.grossAmount}
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
                  {t.netAmount}
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
                  {t.balanceDue}
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
              🖨️ {t.printReceipt}
            </Button>
          )}
          <Button variant="light" color="gray" onClick={onCancel || handleClear}>
            {onCancel ? t.cancel : t.clear}
          </Button>
          <Button variant="filled" color="green" onClick={handleSave}>
            {editPurchase ? t.updatePurchase : t.savePurchase}
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
