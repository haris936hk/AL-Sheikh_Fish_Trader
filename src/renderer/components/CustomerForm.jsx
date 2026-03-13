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
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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

  const t = useMemo(() => ({
    titleEdit: isUr ? 'گاہک میں ترمیم کریں' : 'Edit Customer',
    titleAdd: isUr ? 'نیا گاہک شامل کریں' : 'Add New Customer',
    unsavedTitle: isUr ? 'غیر محفوظ شدہ تبدیلیاں' : 'Unsaved Changes',
    unsavedMsg: isUr ? 'آپ کے پاس غیر محفوظ شدہ تبدیلیاں ہیں۔ کیا آپ واقعی بند کرنا چاہتے ہیں؟ تمام تبدیلیاں ضائع ہو جائیں گی۔' : 'You have unsaved changes. Are you sure you want to close? All changes will be lost.',
    discard: isUr ? 'تبدیلیاں ختم کریں' : 'Discard',
    keepEditing: isUr ? 'ترمیم جاری رکھیں' : 'Keep Editing',
    valErrorTitle: isUr ? 'توثیق کی خرابی' : 'Validation Error',
    valErrorMsg: isUr ? 'براہ کرم محفوظ کرنے سے پہلے غلطیاں درست کریں' : 'Please fix the errors before saving',
    saveSuccessTitle: isUr ? 'گاہک محفوظ' : 'Customer Saved',
    saveSuccessMsg: (name, isEdit) => isUr ? `"${name}" کامیابی سے ${isEdit ? 'اپ ڈیٹ' : 'محفوظ'} ہو گیا` : `"${name}" ${isEdit ? 'updated' : 'created'} successfully`,
    errorTitle: isUr ? 'خرابی' : 'Error',
    saveErrorMsg: isUr ? 'گاہک محفوظ کرنے میں خرابی' : 'Failed to save customer',
    unexpectedErrorMsg: isUr ? 'ایک غیر متوقع خرابی پیش آگئی' : 'An unexpected error occurred',
    nameUrduLabel: isUr ? 'نام (اردو)' : 'Name (Urdu)',
    nameUrduPh: isUr ? 'اردو میں نام لکھیں' : 'Enter name in Urdu',
    nameEngLabel: isUr ? 'نام (انگریزی)' : 'Name (English)',
    nameEngPh: isUr ? 'انگریزی میں گاہک کا نام لکھیں' : 'Enter customer name in English',
    nicLabel: isUr ? 'شناختی کارڈ نمبر' : 'NIC #',
    nicPh: 'XXXXX-XXXXXXX-X',
    mobileLabel: isUr ? 'موبائل نمبر' : 'Mobile #',
    mobilePh: isUr ? 'مثال: 03001234567' : 'e.g., 03001234567',
    phoneLabel: isUr ? 'فون نمبر' : 'Phone #',
    phonePh: isUr ? 'مثال: 0511234567' : 'e.g., 051-1234567',
    emailLabel: isUr ? 'ای میل' : 'Email',
    emailPh: 'customer@example.com',
    countryLabel: isUr ? 'ملک' : 'Country',
    countryPh: isUr ? 'ملک منتخب کریں' : 'Select country',
    cityLabel: isUr ? 'شہر' : 'City',
    cityPh: isUr ? 'شہر منتخب کریں' : 'Select city',
    addressLabel: isUr ? 'پتہ' : 'Address',
    addressPh: isUr ? 'مکمل پتہ درج کریں' : 'Enter complete address',
    notesLabel: isUr ? 'نوٹس' : 'Notes',
    notesPh: isUr ? 'اضافی نوٹس (اختیاری)' : 'Additional notes (optional)',
    closeBtn: isUr ? 'بند کریں' : 'Close',
    clearBtn: isUr ? 'صاف کریں' : 'Clear',
    updateBtn: isUr ? 'اپ ڈیٹ کریں' : 'Update',
    saveBtn: isUr ? 'محفوظ کریں' : 'Save',
    errName: isUr ? 'نام ضروری ہے' : 'Name is required',
    errContact: isUr ? 'کم از کم ایک رابطے کا طریقہ ضروری ہے' : 'At least one contact method is required',
  }), [isUr]);

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
      newErrors.name = t.errName;
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
      newErrors.contact = t.errContact;
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
        title: t.unsavedTitle,
        children: (
          <Text size="sm">
            {t.unsavedMsg}
          </Text>
        ),
        labels: { confirm: t.discard, cancel: t.keepEditing },
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
        title: t.valErrorTitle,
        message: t.valErrorMsg,
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
          title: t.saveSuccessTitle,
          message: t.saveSuccessMsg(formData.name || formData.name_english, isEditMode),
          color: 'green',
        });
        handleClear();
        onSuccess?.();
        onClose();
      } else {
        notifications.show({
          title: t.errorTitle,
          message: result.error || t.saveErrorMsg,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      notifications.show({
        title: t.errorTitle,
        message: error.message || t.unexpectedErrorMsg,
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
            {isEditMode ? t.titleEdit : t.titleAdd}
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
            label={t.nameUrduLabel}
            placeholder={t.nameUrduPh}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            maxLength={100}
          />

          {/* Name (English) */}
          <TextInput
            label={t.nameEngLabel}
            placeholder={t.nameEngPh}
            value={formData.name_english}
            onChange={(e) => handleChange('name_english', e.target.value)}
            maxLength={100}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* NIC */}
          <TextInput
            label={t.nicLabel}
            placeholder={t.nicPh}
            value={formData.nic}
            onChange={(e) => handleNicChange(e.target.value)}
            error={errors.nic}
            maxLength={15}
            className="ltr-field"
          />

          {/* Mobile */}
          <TextInput
            label={t.mobileLabel}
            placeholder={t.mobilePh}
            value={formData.mobile}
            onChange={(e) => handlePhoneChange('mobile', e.target.value)}
            error={errors.mobile}
            className="ltr-field"
          />
        </SimpleGrid>

        <SimpleGrid cols={2} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* Phone */}
          <TextInput
            label={t.phoneLabel}
            placeholder={t.phonePh}
            value={formData.phone}
            onChange={(e) => handlePhoneChange('phone', e.target.value)}
            error={errors.phone}
            className="ltr-field"
          />

          {/* Email */}
          <TextInput
            label={t.emailLabel}
            placeholder={t.emailPh}
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
            label={t.countryLabel}
            placeholder={t.countryPh}
            data={countries}
            value={formData.country_id}
            onChange={(value) => handleChange('country_id', value)}
            searchable
            clearable
          />

          {/* City */}
          <Select
            label={t.cityLabel}
            placeholder={t.cityPh}
            data={cities}
            value={formData.city_id}
            onChange={(value) => handleChange('city_id', value)}
            searchable
            clearable
          />
        </SimpleGrid>

        {/* Address */}
        <Textarea
          label={t.addressLabel}
          placeholder={t.addressPh}
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          rows={3}
          maxLength={255}
          style={{ direction: isUr ? 'rtl' : 'ltr' }}
        />

        {/* Notes */}
        <Textarea
          label={t.notesLabel}
          placeholder={t.notesPh}
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={2}
          maxLength={500}
          style={{ direction: isUr ? 'rtl' : 'ltr' }}
        />

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md" style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          <Button variant="subtle" color="gray" onClick={handleClose}>
            {t.closeBtn}
          </Button>
          <Button variant="light" onClick={handleClear}>
            {t.clearBtn}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditMode ? t.updateBtn : t.saveBtn}
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
