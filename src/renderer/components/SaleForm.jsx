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
  Checkbox,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import '@mantine/dates/styles.css';
import useStore from '../store';

/**
 * SaleForm Component
 * Single-transaction sale form: one item, one customer per sale.
 * Implements FR-SALE-001 through FR-SALE-055.
 *
 * @param {Object} editSale - Sale object to edit (null for new)
 * @param {function} onSaved - Callback after successful save
 * @param {function} onCancel - Callback to cancel/close form
 */
function SaleForm({ editSale, onSaved, onCancel }) {
  const { language } = useStore();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [itemsList, setItemsList] = useState([]);

  const isUr = language === 'ur';
  const t = useMemo(
    () => ({
      title: editSale ? (isUr ? 'بکری ترمیم کریں' : 'Edit Sale') : isUr ? 'نئی بکری' : 'New Sale',
      saleDate: isUr ? 'بکری تاریخ' : 'Sale Date',
      supplier: isUr ? 'بیوپاری' : 'Supplier',
      supplierPh: isUr ? 'بیوپاری منتخب کریں (اختیاری)' : 'Select supplier (optional)',
      vehicleNo: isUr ? 'گاڑی نمبر' : 'Vehicle No',
      details: isUr ? 'تفصیل' : 'Details',
      detailsPh: isUr ? 'مزید تفصیلات...' : 'Additional notes...',
      saleDetails: isUr ? 'بکری تفصیل' : 'Sale Details',
      item: isUr ? 'مچھلی' : 'Item',
      customer: isUr ? 'گاہک' : 'Customer',
      stock: isUr ? 'سٹاک' : 'Stock',
      rateMaund: isUr ? 'ریٹ فی من' : 'Rate/Maund',
      rateKg: isUr ? 'ریٹ فی کلوگرام' : 'Rate/kg',
      weightKg: isUr ? 'وزن کلوگرام' : 'Weight kg',
      totalAmount: isUr ? 'ٹوٹل رقم' : 'Total Amount',
      iceCharges: isUr ? 'برف' : 'Ice Charges',
      fareCharges: isUr ? 'کرایہ' : 'Fare Charges',
      cash: isUr ? 'نقدی' : 'Cash',
      receipt: isUr ? 'وصولی' : 'Receipt',
      summary: isUr ? 'خلاصہ' : 'Summary',
      grossAmount: isUr ? 'مجموعی رقم' : 'Gross Amount',
      charges: isUr ? 'اخراجات' : 'Charges',
      netAmount: isUr ? 'خالص رقم' : 'Net Amount',
      cashReceipt: isUr ? 'نقد + وصولی' : 'Cash + Receipt',
      balance: isUr ? 'بقایا' : 'Balance',
      printReceipt: isUr ? 'رسید پرنٹ کریں' : 'Print Receipt',
      cancel: isUr ? 'منسوخ کریں' : 'Cancel',
      clear: isUr ? 'صاف کریں' : 'Clear',
      saveSale: editSale
        ? isUr
          ? 'بکری اپ ڈیٹ کریں'
          : 'Update Sale'
        : isUr
          ? 'بکری محفوظ کریں'
          : 'Save Sale',
      valErrorItem: isUr ? 'براہ کرم آئٹم منتخب کریں' : 'Please select an item',
      valErrorCustomer: isUr ? 'ہر آئٹم کے لیے گاہک منتخب کریں' : 'Please select a customer',
      insufficientStockTitle: isUr ? 'ناکافی سٹاک' : 'Insufficient Stock',
      insufficientStockMsg: (name, need, avail) =>
        isUr
          ? `${name}: ${need} کلوگرام درکار ہے، ${avail} کلوگرام دستیاب ہے`
          : `${name}: need ${need} kg, available ${avail} kg`,
      saveSuccessTitle: isUr ? 'بکری محفوظ' : 'Sale Saved',
      saveSuccessEditMsg: isUr ? 'بکری کامیابی سے اپ ڈیٹ ہو گئی' : 'Sale updated successfully',
      saveSuccessNewMsg: (num) =>
        isUr ? `بکری نمبر ${num} کامیابی سے محفوظ` : `Sale ${num} created successfully`,
      saveErrorTitle: isUr ? 'خرابی' : 'Error',
      saveErrorMsg: isUr ? 'بکری محفوظ کرنے میں خرابی' : 'Failed to save sale',
      printReceiptTitle: isUr ? 'بکری رسید' : 'Sale Receipt',
      receiptNo: isUr ? 'رسید نمبر' : 'Receipt #',
      date: isUr ? 'تاریخ' : 'Date',
      printErrorMsg: isUr ? 'پرنٹ پیش نظارہ کھولنے میں ناکام' : 'Failed to open print preview',
    }),
    [isUr, editSale]
  );

  // Header fields
  const [saleNumber, setSaleNumber] = useState('00000');
  const [saleDate, setSaleDate] = useState(new Date());
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [details, setDetails] = useState('');

  // Single sale row fields
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isStock, setIsStock] = useState(false);
  const [rateMaund, setRateMaund] = useState('');
  const [rateKg, setRateKg] = useState('');
  const [weight, setWeight] = useState('');
  const [iceCharges, setIceCharges] = useState('');
  const [fareCharges, setFareCharges] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!window.api)
          throw new Error('Electron API not available. Please run the app via Electron.');
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
              label: c.name + (c.name_english ? ` (${c.name_english})` : ''),
            }))
          );
        }

        if (suppliersRes.success) {
          setSuppliers(
            suppliersRes.data.map((s) => ({
              value: String(s.id),
              label: s.name + (s.name_english ? ` (${s.name_english})` : ''),
            }))
          );
        }

        if (itemsRes.success) {
          setItemsList(itemsRes.data);
        }

        if (nextNumRes?.success) {
          setSaleNumber(nextNumRes.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        notifications.show({
          title: 'Error',
          message: `Failed to load form data: ${error.message || 'Unknown error'}`,
          color: 'red',
        });
      }
    };
    loadData();
  }, [editSale]);

  // Load existing sale for editing
  useEffect(() => {
    if (editSale) {
      setSaleNumber(editSale.sale_number);
      setSaleDate(new Date(editSale.sale_date));
      setSelectedSupplier(editSale.supplier_id ? String(editSale.supplier_id) : null);
      setVehicleNumber(editSale.vehicle_number || '');
      setDetails(editSale.details || '');

      // Load the first (and only) line item
      const item = editSale.items?.[0];
      if (item) {
        setSelectedItem(String(item.item_id));
        setSelectedCustomer(item.customer_id ? String(item.customer_id) : null);
        setIsStock(!!item.is_stock);
        setRateMaund(item.rate_per_maund || '');
        setRateKg(item.rate || '');
        setWeight(item.weight || '');
        setIceCharges(item.ice_charges || '');
        setFareCharges(item.fare_charges || '');
        setCashAmount(item.cash_amount || '');
        setReceiptAmount(item.receipt_amount || '');
      }
    }
  }, [editSale]);

  // Items dropdown options
  const itemOptions = useMemo(
    () =>
      itemsList.map((item) => ({
        value: String(item.id),
        label: item.name + (item.name_english ? ` (${item.name_english})` : ''),
      })),
    [itemsList]
  );

  // Dual-rate sync: 1 Maund = 40 kg
  const handleRateMaundChange = (val) => {
    if (val === '') {
      setRateMaund('');
      setRateKg('');
      return;
    }
    const v = Number(val) || 0;
    setRateMaund(v);
    setRateKg(v / 40);
  };

  const handleRateKgChange = (val) => {
    if (val === '') {
      setRateKg('');
      setRateMaund('');
      return;
    }
    const v = Number(val) || 0;
    setRateKg(v);
    setRateMaund(v * 40);
  };

  // Calculated totals
  const totals = useMemo(() => {
    const w = Number(weight) || 0;
    const r = Number(rateKg) || 0;
    const fc = Number(fareCharges) || 0;
    const ic = Number(iceCharges) || 0;
    const ca = Number(cashAmount) || 0;
    const ra = Number(receiptAmount) || 0;

    const lineAmount = w * r;
    const netAmount = lineAmount + fc + ic;
    const balanceAmount = netAmount - ca - ra;
    return {
      grossAmount: lineAmount,
      fareCharges: fc,
      iceCharges: ic,
      netAmount,
      cashReceived: ca,
      receiptAmount: ra,
      balanceAmount,
    };
  }, [weight, rateKg, fareCharges, iceCharges, cashAmount, receiptAmount]);

  // Format date for API
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Save sale
  const handleSave = useCallback(async () => {
    if (!selectedItem) {
      notifications.show({
        title: t.saveErrorTitle,
        message: t.valErrorItem,
        color: 'red',
      });
      return;
    }

    if (!selectedCustomer) {
      notifications.show({
        title: t.saveErrorTitle,
        message: t.valErrorCustomer,
        color: 'red',
      });
      return;
    }

    // Stock availability check (FR-SALE-033, FR-VALID-006)
    try {
      const stockResult = await window.api.items.getAll();
      if (stockResult.success) {
        const stockMap = {};
        stockResult.data.forEach((item) => {
          stockMap[String(item.id)] = { stock: item.current_stock || 0, name: item.name };
        });

        // When editing, add back weight already allocated to this sale
        if (editSale?.items) {
          for (const existingItem of editSale.items) {
            const key = String(existingItem.item_id);
            if (existingItem.is_stock && stockMap[key]) {
              stockMap[key].stock += existingItem.weight || 0;
            }
          }
        }

        const stockInfo = stockMap[String(selectedItem)];
        const numWeight = Number(weight) || 0;
        if (isStock && stockInfo && numWeight > stockInfo.stock) {
          notifications.show({
            title: t.insufficientStockTitle,
            message: t.insufficientStockMsg(
              stockInfo.name,
              numWeight.toFixed(2),
              stockInfo.stock.toFixed(2)
            ),
            color: 'red',
            autoClose: 8000,
          });
          return;
        }
      }
    } catch (error) {
      console.error('Stock check error:', error);
      notifications.show({
        title: t.saveErrorTitle,
        message: t.saveErrorMsg,
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        customer_id: selectedCustomer ? parseInt(selectedCustomer) : null,
        supplier_id: selectedSupplier ? parseInt(selectedSupplier) : null,
        vehicle_number: vehicleNumber || null,
        sale_date: formatDate(saleDate),
        details: details || null,
        items: [
          {
            item_id: parseInt(selectedItem),
            customer_id: selectedCustomer ? parseInt(selectedCustomer) : null,
            is_stock: isStock,
            rate_per_maund: rateMaund || 0,
            rate: rateKg || 0,
            weight: weight || 0,
            fare_charges: fareCharges || 0,
            ice_charges: iceCharges || 0,
            cash_amount: cashAmount || 0,
            receipt_amount: receiptAmount || 0,
            notes: null,
          },
        ],
      };

      let response;
      if (editSale) {
        response = await window.api.sales.update(editSale.id, saleData);
      } else {
        response = await window.api.sales.create(saleData);
      }

      if (response.success) {
        notifications.show({
          title: t.saveSuccessTitle,
          message: editSale ? t.saveSuccessEditMsg : t.saveSuccessNewMsg(response.data.saleNumber),
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
      console.error('Save sale error:', error);
      notifications.show({
        title: t.saveErrorTitle,
        message: t.saveErrorMsg,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [
    selectedItem,
    selectedCustomer,
    selectedSupplier,
    vehicleNumber,
    saleDate,
    details,
    isStock,
    rateMaund,
    rateKg,
    weight,
    fareCharges,
    iceCharges,
    cashAmount,
    receiptAmount,
    editSale,
    onSaved,
    t,
  ]);

  // Print receipt for saved sale
  const handlePrint = useCallback(() => {
    const dateStr = saleDate ? new Date(saleDate).toLocaleDateString('en-PK') : '';
    const itemInfo = itemsList.find((i) => String(i.id) === String(selectedItem));
    const custInfo = customers.find((c) => c.value === String(selectedCustomer));

    const numWeight = Number(weight) || 0;
    const numRateKg = Number(rateKg) || 0;
    const numFare = Number(fareCharges) || 0;
    const numIce = Number(iceCharges) || 0;
    const numCash = Number(cashAmount) || 0;

    const lineAmount = numWeight * numRateKg;
    const totalAmount = lineAmount + numFare + numIce;

    const html = `<!DOCTYPE html><html dir="${isUr ? 'rtl' : 'ltr'}"><head><title>${t.printReceiptTitle} - ${saleNumber}</title>
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
            <h3 style="margin:10px 0 0">${t.printReceiptTitle}</h3>
        </div>
        <div class="info">
            <div><strong>${t.receiptNo}:</strong> ${saleNumber}</div>
            <div><strong>${t.date}:</strong> ${dateStr}</div>
        </div>
        <table>
            <thead><tr><th style="text-align:${isUr ? 'right' : 'left'}">${t.item}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t.customer}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t.weightKg}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t.rateKg}</th><th style="text-align:${isUr ? 'right' : 'left'}">${t.totalAmount}</th></tr></thead>
            <tbody>
              <tr>
                <td style="text-align:${isUr ? 'right' : 'left'}">${itemInfo?.name || ''}</td>
                <td style="text-align:${isUr ? 'right' : 'left'}">${custInfo?.label || ''}</td>
                <td style="text-align:${isUr ? 'right' : 'left'}">${numWeight.toFixed(2)}</td>
                <td style="text-align:${isUr ? 'right' : 'left'}">${numRateKg.toFixed(2)}</td>
                <td style="text-align:${isUr ? 'right' : 'left'}">${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
        </table>
        <table class="totals">
            <tr><td>${t.grossAmount}:</td><td>Rs. ${lineAmount.toFixed(2)}</td></tr>
            <tr><td>${t.fareCharges}:</td><td>Rs. ${numFare.toFixed(2)}</td></tr>
            <tr><td>${t.iceCharges}:</td><td>Rs. ${numIce.toFixed(2)}</td></tr>
            <tr><td>${t.netAmount}:</td><td><strong>Rs. ${totals.netAmount.toFixed(2)}</strong></td></tr>
            <tr><td>${t.cash}:</td><td>Rs. ${numCash.toFixed(2)}</td></tr>
            <tr class="grand-total"><td>${t.balance}:</td><td>Rs. ${totals.balanceAmount.toFixed(2)}</td></tr>
        </table>
        </body></html>`;

    try {
      window.api.print.preview(html, {
        title: `${t.printReceiptTitle} - ${saleNumber}`,
        width: 1000,
        height: 800,
      });
    } catch (error) {
      console.error('Print error:', error);
      notifications.show({
        title: t.saveErrorTitle,
        message: t.printErrorMsg,
        color: 'red',
      });
    }
  }, [
    customers,
    saleDate,
    saleNumber,
    selectedItem,
    selectedCustomer,
    itemsList,
    weight,
    rateKg,
    fareCharges,
    iceCharges,
    cashAmount,
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
    setSelectedCustomer(null);
    setIsStock(false);
    setRateMaund('');
    setRateKg('');
    setWeight('');
    setIceCharges('');
    setFareCharges('');
    setCashAmount('');
    setReceiptAmount('');
  }, []);

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder pos="relative">
      <LoadingOverlay visible={loading} />

      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4} className="text-blue-700">
            💰 {t.title}
          </Title>
          <Badge size="lg" variant="light" color="blue">
            {saleNumber}
          </Badge>
        </Group>

        <Divider />

        {/* Header Fields */}
        <Grid style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid.Col span={4}>
            <DatePickerInput
              label={t.saleDate}
              placeholder=""
              value={saleDate}
              onChange={setSaleDate}
              maxDate={new Date()}
              required
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label={t.supplier}
              placeholder={t.supplierPh}
              data={suppliers}
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              searchable
              clearable
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
              placeholder={t.detailsPh}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              minRows={1}
              maxRows={2}
            />
          </Grid.Col>
        </Grid>

        <Divider label={t.saleDetails} labelPosition="center" />

        {/* Single Sale Row — flat fields */}
        <Grid gutter="md" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* Row 1: Item + Customer + Is Stock */}
          <Grid.Col span={5}>
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
          <Grid.Col span={5}>
            <Select
              label={t.customer}
              placeholder=""
              data={customers}
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              searchable
              required
            />
          </Grid.Col>
          <Grid.Col span={2} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
            <Checkbox
              label={t.stock}
              checked={isStock}
              onChange={(e) => setIsStock(e.currentTarget.checked)}
            />
          </Grid.Col>

          {/* Row 2: Rates + Weight */}
          <Grid.Col span={3}>
            <NumberInput
              label={t.rateMaund}
              value={rateMaund}
              onChange={handleRateMaundChange}
              min={0}
              decimalScale={2}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label={t.rateKg}
              value={rateKg}
              onChange={handleRateKgChange}
              min={0}
              decimalScale={2}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label={t.weightKg}
              value={weight}
              onChange={(val) => setWeight(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="xs" radius="sm" withBorder style={{ background: '#eff6ff' }}>
              <Text size="xs" c="dimmed" mb={2}>
                {t.totalAmount}
              </Text>
              <Text fw={700} size="md" c="blue" dir="ltr" ta={isUr ? 'right' : 'left'}>
                Rs. {totals.netAmount.toFixed(2)}
              </Text>
            </Paper>
          </Grid.Col>

          {/* Row 3: Charges + Payments */}
          <Grid.Col span={3}>
            <NumberInput
              label={t.iceCharges}
              value={iceCharges}
              onChange={(val) => setIceCharges(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label={t.fareCharges}
              value={fareCharges}
              onChange={(val) => setFareCharges(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label={t.cash}
              value={cashAmount}
              onChange={(val) => setCashAmount(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label={t.receipt}
              value={receiptAmount}
              onChange={(val) => setReceiptAmount(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              hideControls
            />
          </Grid.Col>
        </Grid>

        <Divider label={t.summary} labelPosition="center" />

        {/* Summary */}
        <Paper
          p="md"
          radius="sm"
          style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
            direction: isUr ? 'rtl' : 'ltr',
          }}
        >
          {/* Row 1: weight + amounts */}
          <Grid mb="xs" gutter="sm">
            {[
              {
                label: t.grossAmount,
                val: `Rs. ${totals.grossAmount.toFixed(2)}`,
                color: 'dark',
              },
              {
                label: t.charges,
                val: `Rs. ${(totals.fareCharges + totals.iceCharges).toFixed(2)}`,
                color: 'dark',
              },
              {
                label: t.netAmount,
                val: `Rs. ${totals.netAmount.toFixed(2)}`,
                color: 'blue',
              },
            ].map(({ label, val, color }) => (
              <Grid.Col key={label} span={4}>
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
                  {t.cashReceipt}
                </Text>
                <Text fw={600} size="sm" dir="ltr" ta={isUr ? 'right' : 'left'}>
                  Rs. {(totals.cashReceived + totals.receiptAmount).toFixed(2)}
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={6}>
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
                  {t.balance}
                </Text>
                <Text
                  fw={700}
                  size="md"
                  c={totals.balanceAmount > 0 ? 'red' : 'green'}
                  dir="ltr"
                  ta={isUr ? 'right' : 'left'}
                >
                  Rs. {totals.balanceAmount.toFixed(2)}
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {editSale && (
            <Button variant="light" color="teal" onClick={handlePrint}>
              🖨️ {t.printReceipt}
            </Button>
          )}
          <Button variant="light" color="gray" onClick={onCancel || handleClear}>
            {onCancel ? t.cancel : t.clear}
          </Button>
          <Button variant="filled" color="blue" onClick={handleSave}>
            {t.saveSale}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

SaleForm.propTypes = {
  editSale: PropTypes.object,
  onSaved: PropTypes.func,
  onCancel: PropTypes.func,
};

export default SaleForm;
