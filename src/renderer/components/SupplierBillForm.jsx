import {
  Paper,
  Stack,
  Group,
  Text,
  Title,
  Select,
  TextInput,
  NumberInput,
  Button,
  LoadingOverlay,
  Divider,
  Grid,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import '@mantine/dates/styles.css';
import useStore from '../store';
import { formatDisplayName } from '../utils/formatters';
import { validateRequired } from '../utils/validators';

/**
 * SupplierBillForm Component
 * Form for generating supplier bills with date range, charges, and calculations.
 * Implements FR-SUPBILL-001 through FR-SUPBILL-038.
 *
 * @param {function} onPreviewGenerated - Callback when preview data is ready
 * @param {function} onBillSaved - Callback after successful save
 */
function SupplierBillForm({ onPreviewGenerated, onBillSaved }) {
  const language = useStore((s) => s.language);
  const isUr = language === 'ur';

  const t = useMemo(() => ({
    title: isUr ? 'بیوپاری بل' : 'Vendor Bill',
    dateFrom: isUr ? 'تاریخ' : 'From Date',
    dateTo: isUr ? 'سے تاریخ' : 'To Date',
    supplier: isUr ? 'بیوپاری' : 'Supplier',
    supplierPh: isUr ? 'بیوپاری منتخب کریں' : 'Select supplier',
    vehicleNo: isUr ? 'گاڑی نمبر' : 'Vehicle Number',
    chargesTitle: isUr ? 'خرچ' : 'Charges',
    drugsCharges: isUr ? 'منشیانا' : 'Drugs/Chemicals',
    fareCharges: isUr ? 'کرایہ' : 'Fare',
    laborCharges: isUr ? 'مزدوری' : 'Labor',
    iceCharges: isUr ? 'برف' : 'Ice',
    commissionPct: isUr ? 'کمیش %' : 'Commission %',
    commissionAmount: isUr ? 'کمیش' : 'Commission Amount',
    concession: isUr ? 'رعایت' : 'Concession',
    cashPaid: isUr ? 'نقل' : 'Cash Paid',
    summaryTitle: isUr ? 'خلاصہ' : 'Summary',
    totalWeight: isUr ? 'کل وزن' : 'Total Weight',
    grossAmount: isUr ? 'مجموعی رقم' : 'Gross Amount',
    totalCharges: isUr ? 'کل خرچ' : 'Total Charges',
    netPayable: isUr ? 'قابل ادا' : 'Net Payable',
    balanceAmount: isUr ? 'اداینگی رقم' : 'Balance',
    clearBtn: isUr ? 'صاف کریں' : 'Clear',
    goBtn: isUr ? 'پیش نظارہ (Go)' : 'Go (Preview)',
    saveBtn: isUr ? 'بل محفوظ کریں' : 'Save Bill',
    valErrorTitle: isUr ? 'توثیق کی خرابی' : 'Validation Error',
    supplierReqMsg: isUr ? 'براہ کرم بیوپاری منتخب کریں' : 'Please select a supplier',
    dateErrorMsg: isUr ? 'شروع کی تاریخ ختم ہونے کی تاریخ سے بعد نہیں ہو سکتی' : 'Start date cannot be after end date',
    noDataTitle: isUr ? 'کوئی ڈیٹا نہیں' : 'No Data',
    noDataMsg: isUr ? 'منتخب تاریخوں میں اس بیوپاری کا کوئی ڈیٹا نہیں ملا' : 'No sales found for this supplier in the selected date range',
    errorTitle: isUr ? 'خرابی' : 'Error',
    previewErrorMsg: isUr ? 'پیش نظارہ بنانے میں ناکامی' : 'Failed to generate preview',
    previewReqMsg: isUr ? 'براہ کرم پہلے پیش نظارہ بنائیں' : 'Please generate a preview first',
    noItemsMsg: isUr ? 'پیش نظارہ میں آئٹمز کے بغیر بل محفوظ نہیں کیا جا سکتا' : 'Cannot save bill without items in preview',
    grossAmountReqMsg: isUr ? 'مجموعی رقم صفر سے زیادہ ہونی چاہیے' : 'Gross amount must be greater than zero',
    commErrorMsg: isUr ? 'کمیشن 0 اور 100 کے درمیان ہونا چاہیے' : 'Commission must be between 0 and 100',
    saveSuccessTitle: isUr ? 'بل محفوظ' : 'Bill Saved',
    saveSuccessMsg: (num) => isUr ? `بل نمبر ${num} کامیابی سے محفوظ` : `Bill ${num} created successfully`,
    saveErrorMsg: isUr ? 'بل محفوظ کرنے میں خرابی' : 'Failed to save bill',
    errSupplier: isUr ? 'بیوپاری ضروری ہے' : 'Supplier is required',
  }), [isUr]);

  // Form state
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());

  // Header state
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Charges state
  const [commissionPct, setCommissionPct] = useState(5.0);
  const [drugsCharges, setDrugsCharges] = useState('');
  const [fareCharges, setFareCharges] = useState('');
  const [laborCharges, setLaborCharges] = useState('');
  const [iceCharges, setIceCharges] = useState('');
  const [concessionAmount, setConcessionAmount] = useState('');
  const [cashPaid, setCashPaid] = useState('');

  // Calculated values from preview
  const [previewData, setPreviewData] = useState(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const [grossAmount, setGrossAmount] = useState(0);

  // Calculated values
  const numCommissionPct = Number(commissionPct) || 0;
  const numDrugs = Number(drugsCharges) || 0;
  const numFare = Number(fareCharges) || 0;
  const numLabor = Number(laborCharges) || 0;
  const numIce = Number(iceCharges) || 0;
  const numConcession = Number(concessionAmount) || 0;
  const numCash = Number(cashPaid) || 0;

  const commissionAmount = (grossAmount * numCommissionPct) / 100;
  const totalCharges = numDrugs + numFare + numLabor + numIce;
  const netAmount = grossAmount - commissionAmount - totalCharges;
  const totalPayable = netAmount - numConcession;
  const balanceAmount = totalPayable - numCash;

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

  // Format date for API
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Generate preview (Go button)
  const handleGeneratePreview = useCallback(async () => {
    const supplierResult = validateRequired(selectedSupplier, t.errSupplier);
    if (!supplierResult.isValid) {
      notifications.show({
        title: t.valErrorTitle,
        message: t.supplierReqMsg,
        color: 'red',
      });
      return;
    }

    if (dateFrom > dateTo) {
      notifications.show({
        title: t.valErrorTitle,
        message: t.dateErrorMsg,
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await window.api.supplierBills.generatePreview(
        parseInt(selectedSupplier),
        formatDate(dateFrom),
        formatDate(dateTo)
      );

      if (response.success) {
        const data = response.data;
        setPreviewData(data);
        setTotalWeight(data.totalWeight);
        setGrossAmount(data.grossAmount);
        setCommissionPct(data.defaultCommissionPct || 5.0);

        // Notify parent with preview data
        onPreviewGenerated?.({
          ...data,
          supplierId: parseInt(selectedSupplier),
          dateFrom: formatDate(dateFrom),
          dateTo: formatDate(dateTo),
        });

        if (data.items.length === 0) {
          notifications.show({
            title: t.noDataTitle,
            message: t.noDataMsg,
            color: 'yellow',
          });
        }
      } else {
        notifications.show({
          title: t.errorTitle,
          message: response.error || t.previewErrorMsg,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      notifications.show({
        title: t.errorTitle,
        message: t.previewErrorMsg,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSupplier, dateFrom, dateTo, onPreviewGenerated, t]);

  // Save bill
  const handleSave = useCallback(async () => {
    if (!previewData || !selectedSupplier) {
      notifications.show({
        title: t.errorTitle,
        message: t.previewReqMsg,
        color: 'red',
      });
      return;
    }

    if (previewData.items && previewData.items.length === 0) {
      notifications.show({
        title: t.errorTitle,
        message: t.noItemsMsg,
        color: 'red',
      });
      return;
    }

    if (grossAmount <= 0) {
      notifications.show({
        title: t.errorTitle,
        message: t.grossAmountReqMsg,
        color: 'red',
      });
      return;
    }

    if (numCommissionPct < 0 || numCommissionPct > 100) {
      notifications.show({
        title: t.errorTitle,
        message: t.commErrorMsg,
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const billData = {
        supplier_id: parseInt(selectedSupplier),
        vehicle_number: vehicleNumber || null,
        date_from: formatDate(dateFrom),
        date_to: formatDate(dateTo),
        total_weight: totalWeight,
        gross_amount: grossAmount,
        commission_pct: numCommissionPct,
        commission_amount: commissionAmount,
        drugs_charges: numDrugs,
        fare_charges: numFare,
        labor_charges: numLabor,
        ice_charges: numIce,
        other_charges: 0,
        total_charges: totalCharges,
        total_payable: totalPayable,
        concession_amount: numConcession,
        cash_paid: numCash,
        collection_amount: 0,
        balance_amount: balanceAmount,
      };

      const response = await window.api.supplierBills.create(billData);

      if (response.success) {
        notifications.show({
          title: t.saveSuccessTitle,
          message: t.saveSuccessMsg(response.data.billNumber),
          color: 'green',
        });
        onBillSaved?.(response.data);
        // Reset form
        setPreviewData(null);
        setTotalWeight(0);
        setGrossAmount(0);
        setConcessionAmount('');
        setCashPaid('');
      } else {
        notifications.show({
          title: t.errorTitle,
          message: response.error || t.saveErrorMsg,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Save bill error:', error);
      notifications.show({
        title: t.errorTitle,
        message: t.saveErrorMsg,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [
    previewData,
    selectedSupplier,
    vehicleNumber,
    dateFrom,
    dateTo,
    totalWeight,
    grossAmount,
    numCommissionPct,
    commissionAmount,
    numDrugs,
    numFare,
    numLabor,
    numIce,
    totalCharges,
    totalPayable,
    numConcession,
    numCash,
    balanceAmount,
    onBillSaved,
    t,
  ]);

  // Clear form
  const handleClear = useCallback(() => {
    setSelectedSupplier(null);
    setVehicleNumber('');
    setDateFrom(new Date());
    setDateTo(new Date());
    setCommissionPct(5.0);
    setDrugsCharges('');
    setFareCharges('');
    setLaborCharges('');
    setIceCharges('');
    setConcessionAmount('');
    setCashPaid('');
    setPreviewData(null);
    setTotalWeight(0);
    setGrossAmount(0);
    onPreviewGenerated?.(null);
  }, [onPreviewGenerated]);

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder pos="relative">
      <LoadingOverlay visible={loading} />

      <Stack gap="md">
        <Title order={4} className="text-blue-700">
          📄 {t.title}
        </Title>

        <Divider />

        {/* Date Range */}
        <Grid style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid.Col span={6}>
            <DatePickerInput
              label={t.dateFrom}
              placeholder=""
              value={dateFrom}
              onChange={setDateFrom}
              maxDate={dateTo || undefined}
              required
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DatePickerInput
              label={t.dateTo}
              placeholder=""
              value={dateTo}
              onChange={setDateTo}
              minDate={dateFrom || undefined}
              required
            />
          </Grid.Col>
        </Grid>

        {/* Supplier Selection */}
        <div style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Select
            label={t.supplier}
            placeholder={t.supplierPh}
            data={suppliers}
            value={selectedSupplier}
            onChange={setSelectedSupplier}
            searchable
            required
          />
        </div>

        {/* Vehicle Number */}
        <div style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <TextInput
            label={t.vehicleNo}
            placeholder=""
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
          />
        </div>

        <Divider label={t.chargesTitle} labelPosition="center" />

        {/* Charges Grid */}
        <Grid style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid.Col span={6}>
            <NumberInput
              label={t.drugsCharges}
              value={drugsCharges}
              onChange={(val) => setDrugsCharges(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              prefix="Rs. "
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label={t.fareCharges}
              value={fareCharges}
              onChange={(val) => setFareCharges(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              prefix="Rs. "
            />
          </Grid.Col>
        </Grid>

        <Grid style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid.Col span={4}>
            <NumberInput
              label={t.laborCharges}
              value={laborCharges}
              onChange={(val) => setLaborCharges(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              prefix="Rs. "
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t.iceCharges}
              value={iceCharges}
              onChange={(val) => setIceCharges(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              prefix="Rs. "
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t.commissionPct}
              value={commissionPct}
              onChange={(val) => setCommissionPct(val === '' ? '' : val)}
              min={0}
              max={100}
              decimalScale={2}
              suffix="%"
            />
          </Grid.Col>
        </Grid>

        <Grid style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid.Col span={4}>
            <NumberInput
              label={t.commissionAmount}
              value={commissionAmount}
              readOnly
              decimalScale={2}
              prefix="Rs. "
              styles={{ input: { backgroundColor: '#f8f9fa' } }}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t.concession}
              value={concessionAmount}
              onChange={(val) => setConcessionAmount(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              prefix="Rs. "
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t.cashPaid}
              value={cashPaid}
              onChange={(val) => setCashPaid(val === '' ? '' : val)}
              min={0}
              decimalScale={2}
              prefix="Rs. "
            />
          </Grid.Col>
        </Grid>

        <Divider label={t.summaryTitle} labelPosition="center" />

        {/* Summary Display */}
        <Paper p="md" bg="gray.0" radius="sm" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid>
            <Grid.Col span={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t.totalWeight}:
                </Text>
                <Text fw={500} dir="ltr">{totalWeight.toFixed(2)} kg</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t.grossAmount}:
                </Text>
                <Text fw={500} dir="ltr">Rs. {grossAmount.toFixed(2)}</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t.totalCharges}:
                </Text>
                <Text fw={500} c="red" dir="ltr">
                  - Rs. {(commissionAmount + totalCharges).toFixed(2)}
                </Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t.netPayable}:
                </Text>
                <Text fw={600} c="blue" dir="ltr">
                  Rs. {totalPayable.toFixed(2)}
                </Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={12}>
              <Divider my="xs" />
              <Group justify="space-between">
                <Text size="lg" fw={600}>
                  {t.balanceAmount}:
                </Text>
                <Text size="xl" fw={700} c={balanceAmount >= 0 ? 'green' : 'red'} dir="ltr">
                  Rs. {balanceAmount.toFixed(2)}
                </Text>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Button variant="light" color="gray" onClick={handleClear}>
            {t.clearBtn}
          </Button>
          <Button variant="filled" color="teal" onClick={handleGeneratePreview}>
            {t.goBtn}
          </Button>
          <Button variant="filled" color="blue" onClick={handleSave} disabled={!previewData}>
            {t.saveBtn}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

SupplierBillForm.propTypes = {
  onPreviewGenerated: PropTypes.func,
  onBillSaved: PropTypes.func,
};

export default SupplierBillForm;
