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
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import '@mantine/dates/styles.css';
import useStore from '../store';
import { validateRequired } from '../utils/validators';

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
  const { language } = useStore();
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
      saveSuccessTitle: isUr ? 'خریداری محفوظ' : 'Purchase Saved',
      updateSuccessMsg: isUr ? 'خریداری کامیابی سے اپ ڈیٹ ہو گئی' : 'Purchase updated successfully',
      createSuccessMsg: (num) =>
        isUr ? `خریداری نمبر ${num} کامیابی سے محفوظ` : `Purchase ${num} created successfully`,
      saveErrorTitle: isUr ? 'خرابی' : 'Error',
      saveErrorMsg: isUr ? 'خریداری محفوظ کرنے میں خرابی' : 'Failed to save purchase',
      loadErrorMsg: isUr ? 'فارم ڈیٹا لوڈ کرنے میں خرابی' : 'Failed to load form data',
      printErrorTitle: isUr ? 'پرنٹ کی خرابی' : 'Print Error',
      printErrorMsg: isUr ? 'پرنٹ پیش نظارہ खोलने में خرابی' : 'Failed to open print preview',
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

  // Single purchase row fields
  const [selectedItem, setSelectedItem] = useState(null);
  const [rate, setRate] = useState('');
  const [weight, setWeight] = useState('');

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
              label: s.name + (s.name_english ? ` (${s.name_english})` : ''),
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
  }, [editPurchase, t]);

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

      // Load the first (and only) line item
      const item = editPurchase.items?.[0];
      if (item) {
        setSelectedItem(String(item.item_id));
        setRate(Number(item.rate) || '');
        setWeight(Number(item.weight) || '');
      }
    }
  }, [editPurchase]);

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
        label: item.name + (item.name_english ? ` (${item.name_english})` : ''),
      })),
    [itemsList]
  );

  // Calculated totals
  const totals = useMemo(() => {
    const numWeight = Number(weight) || 0;
    const numRate = Number(rate) || 0;
    const numConcession = Number(concessionAmount) || 0;
    const numCash = Number(cashPaid) || 0;
    const numPrevBalance = Number(previousBalance) || 0;

    const grossAmount = numWeight * numRate;
    const netAmount = grossAmount - numConcession;
    const balanceAmount = netAmount - numCash + numPrevBalance;
    return { grossAmount, netAmount, balanceAmount };
  }, [weight, rate, concessionAmount, cashPaid, previousBalance]);

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

    if (!selectedItem) {
      notifications.show({
        title: t.valErrorTitle,
        message: t.selectItemMsg,
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
        items: [
          {
            item_id: parseInt(selectedItem),
            weight: Number(weight) || 0,
            rate: Number(rate) || 0,
            amount: (Number(weight) || 0) * (Number(rate) || 0),
            notes: null,
          },
        ],
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
    selectedItem,
    vehicleNumber,
    purchaseDate,
    details,
    concessionAmount,
    cashPaid,
    weight,
    rate,
    editPurchase,
    onSaved,
    t,
  ]);

  // Print receipt
  const handlePrint = useCallback(() => {
    const supplierName = suppliers.find((s) => s.value === selectedSupplier)?.label || '';
    const dateStr = purchaseDate ? new Date(purchaseDate).toLocaleDateString('en-PK') : '';
    const itemInfo = itemsList.find((i) => String(i.id) === String(selectedItem));
    const numWeight = Number(weight) || 0;
    const numRate = Number(rate) || 0;
    const lineAmount = numWeight * numRate;

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
              <tr>
                <td>${itemInfo?.name || ''}</td>
                <td style="text-align:${isUr ? 'right' : 'left'}">${numWeight.toFixed(2)}</td>
                <td style="text-align:${isUr ? 'right' : 'left'}">${numRate.toFixed(2)}</td>
                <td style="text-align:${isUr ? 'right' : 'left'}">${lineAmount.toFixed(2)}</td>
              </tr>
            </tbody>
        </table>
        <table class="totals">
            <tr><td>${t.grossAmount}:</td><td>Rs. ${totals.grossAmount.toFixed(2)}</td></tr>
            <tr><td>${t.concession}:</td><td>Rs. ${(concessionAmount || 0).toFixed(2)}</td></tr>
            <tr><td>${t.netAmount}:</td><td><strong>Rs. ${totals.netAmount.toFixed(2)}</strong></td></tr>
            <tr><td>${t.cashPaid}:</td><td>Rs. ${(cashPaid || 0).toFixed(2)}</td></tr>
            <tr class="grand-total"><td>${t.balanceDue}:</td><td>Rs. ${totals.balanceAmount.toFixed(2)}</td></tr>
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
    selectedItem,
    itemsList,
    weight,
    rate,
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
    setSelectedItem(null);
    setRate('');
    setWeight('');
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
        <Grid style={{ direction: isUr ? 'rtl' : 'ltr' }}>
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
              dir="ltr"
              styles={{ input: { textAlign: 'left' } }}
            />
          </Grid.Col>
        </Grid>

        <Grid style={{ direction: isUr ? 'rtl' : 'ltr' }}>
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

        {/* Single Purchase Row — flat fields */}
        <Grid gutter="md" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* Row 1: Item + Rate + Weight + Amount */}
          <Grid.Col span={4}>
            <Select
              label={t.item}
              placeholder=""
              data={itemOptions}
              value={selectedItem}
              onChange={setSelectedItem}
              searchable
              required
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <NumberInput
              label={t.rate}
              value={rate}
              onChange={(val) => setRate(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label={t.weight}
              value={weight}
              onChange={(val) => setWeight(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="xs" radius="sm" withBorder style={{ background: '#f0fdf4' }}>
              <Text size="xs" c="dimmed" mb={2}>
                {t.amount}
              </Text>
              <Text
                fw={700}
                size="md"
                c="green"
                style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}
              >
                Rs. {((Number(weight) || 0) * (Number(rate) || 0)).toFixed(2)}
              </Text>
            </Paper>
          </Grid.Col>

          {/* Row 2: Concession + Cash Paid */}
          <Grid.Col span={4}>
            <NumberInput
              label={t.concession}
              value={concessionAmount}
              onChange={(val) => setConcessionAmount(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              hideControls
              dir="ltr"
              styles={{ input: { textAlign: 'left' } }}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t.cashPaid}
              value={cashPaid}
              onChange={(val) => setCashPaid(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              hideControls
              dir="ltr"
              styles={{ input: { textAlign: 'left' } }}
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
                style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}
              >
                Rs. {previousBalance.toFixed(2)}
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
            direction: isUr ? 'rtl' : 'ltr',
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
                  style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}
                >
                  Rs. {totals.grossAmount.toFixed(2)}
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
                  style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}
                >
                  Rs. {totals.netAmount.toFixed(2)}
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
                  style={{ direction: 'ltr', textAlign: isUr ? 'right' : 'left' }}
                >
                  Rs. {totals.balanceAmount.toFixed(2)}
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
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
