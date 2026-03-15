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
import { validateNIC, validateEmail, validatePhone } from '../utils/validators';

/**
 * CustomerForm Component
 * Modal form for creating and editing customer records.
 * Implements FR-CUST-001 through FR-CUST-030.
 *
 * @param {boolean} opened - Whether the modal is open
 * @param {function} onClose - Close handler
 * @param {Object} customer - Customer data for edit mode (null for create)
 * @param {function} onSuccess - Callback after successful save
 */
function CustomerForm({ opened, onClose, customer = null, onSuccess }) {
  const isEditMode = !!customer;
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
    if (customer && opened) {
      const editData = {
        name: customer.name || '',
        name_english: customer.name_english || '',
        nic: customer.nic || '',
        phone: customer.phone || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        address: customer.address || '',
        city_id: customer.city_id ? String(customer.city_id) : null,
        country_id: customer.country_id ? String(customer.country_id) : null,
        notes: customer.notes || '',
      };
      setFormData(editData);
      initialFormData.current = editData;
      setErrors({});
    } else if (opened && !customer) {
      initialFormData.current = { ...formData };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, opened]);

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

    // Required: At least one name (Urdu or English)
    if (!formData.name.trim() && !formData.name_english.trim()) {
      newErrors.name = t('customer.nameRequired');
    }

    // NIC format validation (if provided)
    const nicResult = validateNIC(formData.nic);
    if (!nicResult.isValid) {
      newErrors.nic = nicResult.error;
    }

    // Mobile format validation (if provided)
    const mobileResult = validatePhone(formData.mobile);
    if (!mobileResult.isValid) {
      newErrors.mobile = mobileResult.error;
    }

    // Phone format validation (if provided)
    const phoneResult = validatePhone(formData.phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.error;
    }

    // Email format validation (if provided)
    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error;
    }

    // At least one contact method
    if (!formData.phone && !formData.mobile && !formData.email) {
      newErrors.contact = t('customer.contactRequired');
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
      };

      let result;
      if (isEditMode) {
        result = await window.api.customers.update(customer.id, dataToSubmit);
      } else {
        result = await window.api.customers.create(dataToSubmit);
      }

      if (result.success) {
        notifications.show({
          title: t('customer.saved'),
          message: isEditMode
            ? t('customer.updatedSuccess', { name: formData.name || formData.name_english })
            : t('customer.createdSuccess', { name: formData.name || formData.name_english }),
          color: 'green',
        });
        handleClear();
        onSuccess?.();
        onClose();
      } else {
        notifications.show({
          title: t('error.title', 'Error'),
          message: result.error || t('customer.error', 'Failed to save customer'),
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
  }, [formData, isEditMode, customer, validate, handleClear, onSuccess, onClose, t]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <Text size="xl">👤</Text>
          <Text size="lg" fw={600}>
            {t(isEditMode ? 'customer.edit' : 'customer.addNew')}
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
          {/* Name (Urdu) */}
          <TextInput
            label={t('customer.nameUr', 'Name (Urdu)')}
            placeholder={t('customer.nameUrPlaceholder')}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            maxLength={100}
          />

          {/* Name (English) */}
          <TextInput
            label={t('customer.nameEn', 'Name (English)')}
            placeholder={t('customer.nameEnPlaceholder')}
            value={formData.name_english}
            onChange={(e) => handleChange('name_english', e.target.value)}
            maxLength={100}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* NIC */}
          <TextInput
            label={t('customer.nic', 'NIC #')}
            placeholder="XXXXX-XXXXXXX-X"
            value={formData.nic}
            onChange={(e) => handleNicChange(e.target.value)}
            error={errors.nic}
            maxLength={15}
            className="ltr-field"
          />

          {/* Mobile */}
          <TextInput
            label={t('customer.mobile', 'Mobile #')}
            placeholder={t('customer.mobilePh', 'e.g., 03001234567')}
            value={formData.mobile}
            onChange={(e) => handlePhoneChange('mobile', e.target.value)}
            error={errors.mobile}
            className="ltr-field"
          />
        </SimpleGrid>

        <SimpleGrid cols={2} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* Phone */}
          <TextInput
            label={t('customer.phone', 'Phone #')}
            placeholder={t('customer.phonePh', 'e.g., 051-1234567')}
            value={formData.phone}
            onChange={(e) => handlePhoneChange('phone', e.target.value)}
            error={errors.phone}
            className="ltr-field"
          />

          {/* Email */}
          <TextInput
            label={t('customer.email', 'Email')}
            placeholder="customer@example.com"
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
            label={t('customer.country', 'Country')}
            placeholder={t('customer.countryPlaceholder')}
            data={countries}
            value={formData.country_id}
            onChange={(value) => handleChange('country_id', value)}
            searchable
            clearable
          />

          {/* City */}
          <Select
            label={t('customer.city', 'City')}
            placeholder={t('customer.cityPlaceholder')}
            data={cities}
            value={formData.city_id}
            onChange={(value) => handleChange('city_id', value)}
            searchable
            clearable
          />
        </SimpleGrid>

        {/* Address */}
        <Textarea
          label={t('customer.address', 'Address')}
          placeholder={t('customer.addressPlaceholder')}
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          rows={3}
          maxLength={255}
          style={{ direction: isUr ? 'rtl' : 'ltr' }}
        />

        {/* Notes */}
        <Textarea
          label={t('customer.notes', 'Notes')}
          placeholder={t('customer.notesPlaceholder')}
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

CustomerForm.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default CustomerForm;
