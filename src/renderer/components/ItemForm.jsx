import {
  Modal,
  TextInput,
  NumberInput,
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
import { validateRequired, validatePositiveNumber, validateLength } from '../utils/validators';

/**
 * ItemForm Component
 * Modal form for creating and editing inventory items.
 * Implements FR-ITEM-001 through FR-ITEM-019.
 *
 * @param {boolean} opened - Whether the modal is open
 * @param {function} onClose - Close handler
 * @param {Object} item - Item data for edit mode (null for create)
 * @param {function} onSuccess - Callback after successful save
 */
function ItemForm({ opened, onClose, item = null, onSuccess }) {
  const isEditMode = !!item;
  const language = useStore((s) => s.language);
  const isUr = language === 'ur';
  const { t } = useTranslation();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_english: '',
    unit_price: '',
    category_id: null,
    notes: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  // Track initial form data for dirty detection
  const initialFormData = useRef(null);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const categoriesResult = await window.api.reference.getCategories();

        if (categoriesResult.success) {
          setCategories([
            { value: '', label: t('common.none', 'None') },
            ...categoriesResult.data.map((c) => ({
              value: String(c.id),
              label: c.name_urdu ? `${c.name} (${c.name_urdu})` : c.name,
            })),
          ]);
        }
      } catch (error) {
        console.error('Failed to load reference data:', error);
      }
    };

    if (opened) {
      loadReferenceData();
    }
  }, [opened, t]);

  // Populate form when editing
  useEffect(() => {
    if (item && opened) {
      const editData = {
        name: item.name || '',
        name_english: item.name_english || '',
        unit_price: item.unit_price || '',
        category_id: item.category_id ? String(item.category_id) : null,
        notes: item.notes || '',
      };
      setFormData(editData);
      initialFormData.current = editData;
      setErrors({});
    } else if (opened && !item) {
      initialFormData.current = { ...formData };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, opened]);

  // Handle input change
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  // Validate form
  // Validate form using centralized validators
  const validate = useCallback(() => {
    const newErrors = {};

    // Required: Name (Urdu)
    const nameResult = validateRequired(formData.name, t('common.name', 'Name'));
    if (!nameResult.isValid) {
      newErrors.name = t('item.nameUrduReq', 'Name (Urdu) is required');
    } else {
      const lengthResult = validateLength(formData.name.trim(), { min: 2, max: 100, fieldName: t('common.name', 'Name') });
      if (!lengthResult.isValid) {
        newErrors.name = t('item.nameLength', 'Name must be at least 2 characters');
      }
    }

    // Unit price must be non-negative
    const priceResult = validatePositiveNumber(formData.unit_price, t('item.unitPrice', 'Unit Price'), true);
    if (!priceResult.isValid) {
      newErrors.unit_price = t('item.priceNegative', 'Unit price cannot be negative');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Clear form
  const handleClear = useCallback(() => {
    setFormData({
      name: '',
      name_english: '',
      unit_price: '',
      category_id: null,
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
        title: t('item.unsavedTitle', 'Unsaved Changes'),
        children: (
          <Text size="sm">
            {t('item.unsavedMsg', 'You have unsaved changes. Are you sure you want to close? All changes will be lost.')}
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
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        unit_price: parseFloat(formData.unit_price) || 0,
      };

      let result;
      if (isEditMode) {
        result = await window.api.items.update(item.id, dataToSubmit);
      } else {
        result = await window.api.items.create(dataToSubmit);
      }

      if (result.success) {
        notifications.show({
          title: t('item.saved', 'Item Saved'),
          message: isEditMode ? t('item.updated', 'Item updated successfully') : t('item.saved', 'Item saved successfully'),
          color: 'green',
        });
        handleClear();
        onSuccess?.();
        onClose();
      } else {
        notifications.show({
          title: t('error.title', 'Error'),
          message: result.error || t('item.error', 'Failed to save item'),
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
  }, [formData, isEditMode, item, validate, handleClear, onSuccess, onClose, t]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <Text size="xl">📦</Text>
          <Text size="lg" fw={600}>
            {isEditMode ? t('item.editTitle', 'Edit Item') : t('item.addTitle', 'Add New Item')}
          </Text>
        </Group>
      }
      size="md"
      centered
      closeOnClickOutside={false}
    >
      <LoadingOverlay visible={loading} />

      <Stack gap="md">
        <SimpleGrid cols={2} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* Name (Urdu) - Required */}
          <TextInput
            label={t('item.name', 'Item Name (Urdu)')}
            placeholder={isUr ? 'اردو میں نام لکھیں' : 'Enter name in Urdu'}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            maxLength={100}
          />

          {/* Name (English) */}
          <TextInput
            label={t('item.nameEnglish', 'Item Name (English)')}
            placeholder={isUr ? 'انگریزی میں مال کا نام لکھیں' : 'Enter item name in English'}
            value={formData.name_english}
            onChange={(e) => handleChange('name_english', e.target.value)}
            maxLength={100}
          />
        </SimpleGrid>

        <SimpleGrid cols={2} style={{ direction: isUr ? 'rtl' : 'ltr' }}>
          {/* Unit Price */}
          <NumberInput
            label={t('item.unitPrice', 'Unit Price (Rs.)')}
            placeholder="0.00"
            value={formData.unit_price}
            onChange={(value) => handleChange('unit_price', value === '' ? '' : value)}
            error={errors.unit_price}
            min={0}
            decimalScale={2}
            fixedDecimalScale
            thousandSeparator=","
            className="ltr-field"
          />

          {/* Category */}
          <Select
            label={t('item.category', 'Category')}
            placeholder={isUr ? 'زمرہ منتخب کریں' : 'Select category'}
            data={categories}
            value={formData.category_id}
            onChange={(value) => handleChange('category_id', value)}
            searchable
            clearable
          />
        </SimpleGrid>

        {/* Notes */}
        <Textarea
          label={t('common.notes', 'Notes')}
          placeholder={isUr ? 'اضافی نوٹس (اختیاری)' : 'Additional notes (optional)'}
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
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

ItemForm.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default ItemForm;
