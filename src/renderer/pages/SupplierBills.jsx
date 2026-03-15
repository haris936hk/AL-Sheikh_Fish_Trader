import { Title, Text, Button, Group, Stack, Paper } from '@mantine/core';
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SupplierBillForm, SupplierBillPreview } from '../components';

/**
 * SupplierBills Page Component
 * Main container for supplier bill generation.
 * Implements FR-SUPBILL requirements.
 *
 * @param {function} onBack - Callback to navigate back to dashboard
 */
function SupplierBills({ onBack }) {
  const { t } = useTranslation();
  const [previewData, setPreviewData] = useState(null);

  // Handle preview generation
  const handlePreviewGenerated = useCallback((data) => {
    setPreviewData(data);
  }, []);

  // Handle bill saved
  const handleBillSaved = useCallback((_result) => {
    // Reset preview after save
    setPreviewData(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 dark:from-gray-900 dark:to-slate-800">
      {/* Header */}
      <Paper
        shadow="md"
        className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-800"
        style={{ borderRadius: 0 }}
      >
        <div className="px-8 py-6">
          <Group justify="space-between" align="center">
            <Stack gap={4}>
              <Title order={1} c="white" className="text-3xl font-bold">
                📄 {t('supplierBill.title')}
              </Title>
              <Text c="white" opacity={0.9} size="md">
                {t('supplierBill.addNew')}
              </Text>
            </Stack>
            <Button variant="light" color="gray" onClick={onBack} leftSection={<span>🏠</span>}>
              {t('nav.dashboard')}
            </Button>
          </Group>
        </div>
      </Paper>

      {/* Main Content - Split Layout */}
      <div className="p-8">
        <div className="flex gap-8">
          {/* Left Panel - Form */}
          <div className="flex-[4]">
            <SupplierBillForm
              onPreviewGenerated={handlePreviewGenerated}
              onBillSaved={handleBillSaved}
            />
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-[6]">
            <SupplierBillPreview previewData={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}

SupplierBills.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default SupplierBills;
