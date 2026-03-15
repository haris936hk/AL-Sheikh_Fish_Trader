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
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import '@mantine/dates/styles.css';
import useStore from '../store';
import { formatDisplayName, formatDateForAPI } from '../utils/formatters';


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
  const { t } = useTranslation();

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

  // Generate preview
  const handleGeneratePreview = useCallback(async () => {
    if (!selectedSupplier) {
      notifications.show({
        title: t('validation.title', 'Validation Error'),
        message: t('validation.selectSupplier', 'Please select a vendor'),
        color: 'red',
      });
      return;
    }

    if (dateFrom > dateTo) {
      notifications.show({
        title: t('validation.title', 'Validation Error'),
        message: t('supplierBill.dateError', 'Start date cannot be after end date'),
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await window.api.supplierBills.generatePreview(
      parseInt(selectedSupplier),
      formatDateForAPI(dateFrom),
      formatDateForAPI(dateTo)
    );

    if (response.success) {
      const data = response.data;
      setPreviewData(data);
      setTotalWeight(data.totalWeight);
      setGrossAmount(data.grossAmount);
      setCommissionPct(data.defaultCommissionPct || 5.0);

      // onPreviewGenerated is now handled by the useEffect for live updates
      if (data.items.length === 0) {
          notifications.show({
            title: t('supplierBill.noDataTitle', 'No Data'),
            message: t('supplierBill.noDataMsg', 'No sales found for this vendor in the selected date range'),
            color: 'yellow',
          });
        }
      } else {
        notifications.show({
          title: t('error.title', 'Error'),
          message: response.error || t('supplierBill.previewError', 'Failed to generate preview'),
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      notifications.show({
        title: t('error.title', 'Error'),
        message: t('supplierBill.previewError', 'Failed to generate preview'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSupplier, dateFrom, dateTo, t]);

  // Save bill
  const handleSave = useCallback(async () => {
    if (!previewData || !selectedSupplier) {
      notifications.show({
        title: t('error.title', 'Error'),
        message: t('supplierBill.previewReqMsg', 'Please generate a preview first'),
        color: 'red',
      });
      return;
    }

    if (previewData.items && previewData.items.length === 0) {
      notifications.show({
        title: t('error.title', 'Error'),
        message: t('supplierBill.noItemsMsg', 'Cannot save bill without items in preview'),
        color: 'red',
      });
      return;
    }

    if (grossAmount <= 0) {
      notifications.show({
        title: t('error.title', 'Error'),
        message: t('supplierBill.grossAmountReqMsg', 'Gross amount must be greater than zero'),
        color: 'red',
      });
      return;
    }

    if (numCommissionPct < 0 || numCommissionPct > 100) {
      notifications.show({
        title: t('error.title', 'Error'),
        message: t('supplierBill.commErrorMsg', 'Commission must be between 0 and 100'),
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const billData = {
        supplier_id: parseInt(selectedSupplier),
        vehicle_number: vehicleNumber || null,
        date_from: formatDateForAPI(dateFrom),
        date_to: formatDateForAPI(dateTo),
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
          title: t('supplierBill.saved', 'Bill Saved'),
          message: isUr ? `بل نمبر ${response.data.billNumber} کامیابی سے محفوظ` : `Bill ${response.data.billNumber} created successfully`,
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
          title: t('error.title', 'Error'),
          message: response.error || t('supplierBill.error', 'Failed to save bill'),
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Save bill error:', error);
      notifications.show({
        title: t('error.title', 'Error'),
        message: t('supplierBill.error', 'Failed to save bill'),
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
    isUr,
    t,
  ]);

  // Sync real-time charges and balances to preview
  useEffect(() => {
    if (previewData) {
      onPreviewGenerated?.({
        ...previewData,
        supplierId: parseInt(selectedSupplier),
        dateFrom: formatDateForAPI(dateFrom),
        dateTo: formatDateForAPI(dateTo),
        vehicleNumber,
        commissionPct: numCommissionPct,
        commissionAmount,
        drugsCharges: numDrugs,
        fareCharges: numFare,
        laborCharges: numLabor,
        iceCharges: numIce,
        totalCharges,
        concessionAmount: numConcession,
        cashPaid: numCash,
        totalPayable,
        balanceAmount,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    previewData,
    selectedSupplier,
    dateFrom,
    dateTo,
    vehicleNumber,
    numCommissionPct,
    commissionAmount,
    numDrugs,
    numFare,
    numLabor,
    numIce,
    totalCharges,
    numConcession,
    numCash,
    totalPayable,
    balanceAmount,
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
          📄 {t('supplierBill.title', 'Vendor Bill')}
        </Title>

        <Divider />

        {/* Date Range */}
        <Grid style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid.Col span={6}>
            <DatePickerInput
              label={t('supplierBill.fromDate', 'From Date')}
              placeholder=""
              value={dateFrom}
              onChange={setDateFrom}
              maxDate={dateTo || undefined}
              required
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <DatePickerInput
              label={t('supplierBill.toDate', 'To Date')}
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
            label={t('supplierBill.supplier', 'Vendor')}
            placeholder={isUr ? 'بیوپاری منتخب کریں' : 'Select vendor'}
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
            label={t('supplierBill.vehicle', 'Vehicle Number')}
            placeholder=""
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
          />
        </div>

        <Divider label={t('supplierBill.chargesTitle', 'Charges')} labelPosition="center" />

        {/* Charges Grid */}
        <Grid style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid.Col span={6}>
            <NumberInput
              label={t('supplierBill.drugsChemicals', 'Drugs/Chemicals')}
              value={drugsCharges}
              onChange={(val) => setDrugsCharges(val === '' ? '' : val)}
              min={0}
              decimalScale={0}
              prefix="Rs. "
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label={t('supplierBill.fare', 'Fare')}
              value={fareCharges}
              onChange={(val) => setFareCharges(val === '' ? '' : val)}
              min={0}
              decimalScale={0}
              prefix="Rs. "
            />
          </Grid.Col>
        </Grid>

        <Grid style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid.Col span={4}>
            <NumberInput
              label={t('supplierBill.labor', 'Labor')}
              value={laborCharges}
              onChange={(val) => setLaborCharges(val === '' ? '' : val)}
              min={0}
              decimalScale={0}
              prefix="Rs. "
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t('supplierBill.ice', 'Ice')}
              value={iceCharges}
              onChange={(val) => setIceCharges(val === '' ? '' : val)}
              min={0}
              decimalScale={0}
              prefix="Rs. "
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t('supplierBill.commissionPct', 'Commission %')}
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
              label={t('supplierBill.commissionAmt', 'Commission Amount')}
              value={Math.round(commissionAmount)}
              readOnly
              decimalScale={0}
              prefix="Rs. "
              styles={{ input: { backgroundColor: '#f8f9fa' } }}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t('supplierBill.concession', 'Concession')}
              value={concessionAmount}
              onChange={(val) => setConcessionAmount(val === '' ? '' : val)}
              min={0}
              decimalScale={0}
              prefix="Rs. "
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label={t('supplierBill.cashPaid', 'Cash Paid')}
              value={cashPaid}
              onChange={(val) => setCashPaid(val === '' ? '' : val)}
              min={0}
              decimalScale={0}
              prefix="Rs. "
            />
          </Grid.Col>
        </Grid>

        <Divider label={t('supplierBill.summaryTitle', 'Summary')} labelPosition="center" />

        {/* Summary Display */}
        <Paper p="md" bg="gray.0" radius="sm" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Grid>
            <Grid.Col span={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('supplierBill.totalWeight', 'Total Weight')}:
                </Text>
                <Text fw={500} dir="ltr">{totalWeight.toFixed(2)} kg</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('supplierBill.grossAmount', 'Gross Amount')}:
                </Text>
                <Text fw={500} dir="ltr">Rs. {Math.round(grossAmount).toLocaleString('en-US')}</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('supplierBill.totalCharges', 'Total Charges')}:
                </Text>
                <Text fw={500} c="red" dir="ltr">
                  - Rs. {Math.round(commissionAmount + totalCharges).toLocaleString('en-US')}
                </Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('supplierBill.netPayable', 'Net Payable')}:
                </Text>
                <Text fw={600} c="blue" dir="ltr">
                  Rs. {Math.round(totalPayable).toLocaleString('en-US')}
                </Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={12}>
              <Divider my="xs" />
              <Group justify="space-between">
                <Text size="lg" fw={600}>
                  {t('supplierBill.balanceAmount', 'Balance')}:
                </Text>
                <Text size="xl" fw={700} c={balanceAmount >= 0 ? 'green' : 'red'} dir="ltr">
                  Rs. {Math.round(balanceAmount).toLocaleString('en-US')}
                </Text>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Button variant="light" color="gray" onClick={handleClear}>
            {t('app.clear', 'Clear')}
          </Button>
          <Button variant="filled" color="teal" onClick={handleGeneratePreview}>
            {t('supplierBill.goBtn', 'Go (Preview)')}
          </Button>
          <Button variant="filled" color="blue" onClick={handleSave} disabled={!previewData}>
            {t('supplierBill.saveBtn', 'Save Bill')}
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
