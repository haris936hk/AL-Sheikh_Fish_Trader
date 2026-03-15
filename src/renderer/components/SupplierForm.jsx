import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Text,
  SimpleGrid,
  LoadingOverlay,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '../store';
import { validateRequired, validateNIC, validateEmail, validatePhone, validatePercentage } from '../utils/validators';

/**
 * SupplierForm Component
 * Modal form for creating and editing supplier records.
 * Implements FR-SUP-001 through FR-SUP-030.
 *
 * @param {boolean} opened - Whether the modal is open
 * @param {function} onClose - Close handler
 * @param {Object} supplier - Supplier data for edit mode (null for create)
 * @param {function} onSuccess - Callback after successful save
 */
function SupplierForm({ opened, onClose, supplier = null, onSuccess }) {
  const isEditMode = !!supplier;
  const language = useStore((s) => s.language);
  const isUr = language === 'ur';
  const { t } = useTranslation();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_english: '',
    nic: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    city_id: null,
    country_id: null,
    default_commission_pct: '5.0',
    notes: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [errors, setErrors] = useState({});

  // Track initial form data for dirty detection
  const initialFormData = useRef(null);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [citiesResult, countriesResult] = await Promise.all([
          window.api.reference.getCities(),
          window.api.reference.getCountries(),
        ]);

        if (citiesResult.success) {
          setCities(
            citiesResult.data.map((c) => ({
              value: String(c.id),
              label: `${c.name} (${c.name_urdu || c.name})`,
            }))
          );
        }

        if (countriesResult.success) {
          setCountries(
            countriesResult.data.map((c) => ({
              value: String(c.id),
              label: `${c.name} (${c.name_urdu || c.name})`,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load reference data:', error);
      }
    };

    if (opened) {
      loadReferenceData();
    }
  }, [opened]);

  // Populate form when editing
  useEffect(() => {
    if (supplier && opened) {
      const editData = {
        name: supplier.name || '',
        name_english: supplier.name_english || '',
        nic: supplier.nic || '',
        phone: supplier.phone || '',
        mobile: supplier.mobile || '',
        email: supplier.email || '',
        address: supplier.address || '',
        city_id: supplier.city_id ? String(supplier.city_id) : null,
        country_id: supplier.country_id ? String(supplier.country_id) : null,
        default_commission_pct: String(supplier.default_commission_pct || '5.0'),
        notes: supplier.notes || '',
      };
      setFormData(editData);
      initialFormData.current = editData;
      setErrors({});
    } else if (opened && !supplier) {
      // New form — snapshot the default state
      initialFormData.current = { ...formData };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier, opened]);

  // Handle input change
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  // Format NIC as user types (XXXXX-XXXXXXX-X)
  const handleNicChange = useCallback(
    (value) => {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');

      // Format: XXXXX-XXXXXXX-X
      let formatted = '';
      if (digits.length > 0) {
        formatted = digits.slice(0, 5);
      }
      if (digits.length > 5) {
        formatted += `-${digits.slice(5, 12)}`;
      }
      if (digits.length > 12) {
        formatted += `-${digits.slice(12, 13)}`;
      }

      handleChange('nic', formatted);
    },
    [handleChange]
  );

  // Format phone number as user types (03XX-XXXXXXX or 0XX-XXXXXXX)
  const handlePhoneChange = useCallback(
    (field, value) => {
      const digits = value.replace(/\D/g, '');
      let formatted = digits;
      // Mobile format: 03XX-XXXXXXX
      if (digits.length >= 4 && digits.startsWith('03')) {
        formatted = digits.slice(0, 4) + (digits.length > 4 ? `-${digits.slice(4, 11)}` : '');
      }
      // Landline format: 0XX-XXXXXXX
      else if (digits.length >= 3 && digits.startsWith('0')) {
        formatted = digits.slice(0, 3) + (digits.length > 3 ? `-${digits.slice(3, 10)}` : '');
      }
      handleChange(field, formatted);
    },
    [handleChange]
  );

  // Validate form using centralized validators
  const validate = useCallback(() => {
    const newErrors = {};

    // Required: Name (Urdu)
    const nameResult = validateRequired(formData.name, t('common.name', 'Name'));
    if (!nameResult.isValid) {
      newErrors.name = t('supplier.nameRequired', 'Name is required');
    }

    // NIC format validation (if provided)
    const nicResult = validateNIC(formData.nic);
    if (!nicResult.isValid) {
      newErrors.nic = nicResult.error;
    }

    // Phone format validation (if provided)
    const phoneResult = validatePhone(formData.phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.error;
    }

    // Mobile format validation (if provided)
    const mobileResult = validatePhone(formData.mobile);
    if (!mobileResult.isValid) {
      newErrors.mobile = mobileResult.error;
    }

    // Email format validation (if provided)
    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error;
    }

    // At least one contact method
    if (!formData.phone && !formData.mobile && !formData.email) {
      newErrors.contact = t('supplier.contactRequired', 'At least one contact method is required');
    }

    // Commission percentage validation
    const commissionResult = validatePercentage(formData.default_commission_pct, 'Commission Percentage');
    if (!commissionResult.isValid) {
      newErrors.default_commission_pct = commissionResult.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Clear form
  const handleClear = useCallback(() => {
    setFormData({
      name: '',
      name_english: '',
      nic: '',
      phone: '',
      mobile: '',
      email: '',
      address: '',
      city_id: null,
      country_id: null,
      default_commission_pct: '5.0',
      notes: '',
    });
    setErrors({});
  }, []);

  // Check if form has unsaved changes
  const isDirty = useCallback(() => {
    if (!initialFormData.current) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData.current);
  }, [formData]);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (isDirty()) {
      modals.openConfirmModal({
        title: t('app.unsavedChanges', 'Unsaved Changes'),
        children: (
          <Text size="sm">
            {t('app.discardChangesExt', 'You have unsaved changes. Are you sure you want to close? All changes will be lost.')}
          </Text>
        ),
        labels: { confirm: t('app.discard', 'Discard'), cancel: t('app.keepEditing', 'Keep Editing') },
        confirmProps: { color: 'red' },
        onConfirm: () => {
          handleClear();
          onClose();
        },
      });
    } else {
      handleClear();
      onClose();
    }
  }, [isDirty, handleClear, onClose, t]);

  // Submit form
  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      notifications.show({
        title: t('validation.title', 'Validation Error'),
        message: t('validation.fixErrors', 'Please fix the errors before saving'),
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        city_id: formData.city_id ? parseInt(formData.city_id, 10) : null,
        country_id: formData.country_id ? parseInt(formData.country_id, 10) : null,
        default_commission_pct: parseFloat(formData.default_commission_pct) || 5.0,
      };

      let result;
      if (isEditMode) {
        result = await window.api.suppliers.update(supplier.id, dataToSubmit);
      } else {
        result = await window.api.suppliers.create(dataToSubmit);
      }

      if (result.success) {
        notifications.show({
          title: t('supplier.saved', 'Supplier Saved'),
          message: isEditMode
            ? t('supplier.updatedSuccess', 'Supplier "{{name}}" has been updated successfully', { name: formData.name })
            : t('supplier.createdSuccess', 'Supplier "{{name}}" has been created successfully', { name: formData.name }),
          color: 'green',
        });
        handleClear();
        onSuccess?.();
        onClose();
      } else {
        notifications.show({
          title: t('error.title', 'Error'),
          message: result.error || t('supplier.error', 'Failed to save supplier'),
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      notifications.show({
        title: t('error.title', 'Error'),
        message: error.message || t('error.unexpected', 'An unexpected error occurred'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [formData, isEditMode, supplier, validate, handleClear, onSuccess, onClose, t]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <Text size="xl">👤</Text>
          <Text size="lg" fw={600}>
            {isEditMode ? t('supplier.edit', 'Edit Supplier') : t('supplier.add', 'Add New Supplier')}
          </Text>
        </Group>
      }
      size="lg"
      centered
      closeOnClickOutside={false}
    >
      <LoadingOverlay visible={loading} />

      <Stack gap="md">
        {/* Error summary for contact validation */}
        {errors.contact && (
          <Text c="red" size="sm" ta="center">
            {errors.contact}
          </Text>
        )}

        <SimpleGrid cols={2} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* Name (Urdu) - Required */}
          <TextInput
            label={t('supplier.nameUr', 'Name (Urdu)')}
            placeholder={t('supplier.nameUrPlaceholder', 'Enter name in Urdu')}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            maxLength={100}
          />

          {/* Name (English) */}
          <TextInput
            label={t('supplier.nameEn', 'Name (English)')}
            placeholder={t('supplier.nameEnPlaceholder', 'Enter supplier name in English')}
            value={formData.name_english}
            onChange={(e) => handleChange('name_english', e.target.value)}
            maxLength={100}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* NIC */}
          <TextInput
            label={t('supplier.nic', 'NIC #')}
            placeholder="XXXXX-XXXXXXX-X"
            value={formData.nic}
            onChange={(e) => handleNicChange(e.target.value)}
            error={errors.nic}
            maxLength={15}
            className="ltr-field"
          />

          {/* Phone */}
          <TextInput
            label={t('supplier.phone', 'Phone #')}
            placeholder={t('supplier.phonePh', 'e.g., 051-1234567')}
            value={formData.phone}
            onChange={(e) => handlePhoneChange('phone', e.target.value)}
            error={errors.phone}
            className="ltr-field"
          />
        </SimpleGrid>

        <SimpleGrid cols={2} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* Mobile */}
          <TextInput
            label={t('supplier.mobile', 'Mobile #')}
            placeholder={t('supplier.mobilePh', 'e.g., 03001234567')}
            value={formData.mobile}
            onChange={(e) => handlePhoneChange('mobile', e.target.value)}
            error={errors.mobile}
            className="ltr-field"
          />

          {/* Email */}
          <TextInput
            label={t('supplier.email', 'Email')}
            placeholder="supplier@example.com"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            className="ltr-field"
          />
        </SimpleGrid>

        <SimpleGrid cols={2} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* Country */}
          <Select
            label={t('supplier.country', 'Country')}
            placeholder={t('supplier.countryPlaceholder', 'Select country')}
            data={countries}
            value={formData.country_id}
            onChange={(value) => handleChange('country_id', value)}
            searchable
            clearable
          />

          {/* City */}
          <Select
            label={t('supplier.city', 'City')}
            placeholder={t('supplier.cityPlaceholder', 'Select city')}
            data={cities}
            value={formData.city_id}
            onChange={(value) => handleChange('city_id', value)}
            searchable
            clearable
          />
        </SimpleGrid>

        {/* Address */}
        <Textarea
          label={t('supplier.address', 'Address')}
          placeholder={t('supplier.addressPlaceholder', 'Enter complete address')}
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          rows={3}
          maxLength={255}
          style={{ direction: isUr ? 'rtl' : 'ltr' }}
        />

        {/* Notes */}
        <Textarea
          label={t('supplier.notes', 'Notes')}
          placeholder={t('supplier.notesPlaceholder', 'Additional notes (optional)')}
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={2}
          maxLength={500}
          style={{ direction: isUr ? 'rtl' : 'ltr' }}
        />

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Button variant="subtle" color="gray" onClick={handleClose}>
            {t('app.close', 'Close')}
          </Button>
          <Button variant="light" onClick={handleClear}>
            {t('app.clear', 'Clear')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditMode ? t('app.update', 'Update') : t('app.save', 'Save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

SupplierForm.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  supplier: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default SupplierForm;
