import { Paper, Stack, Group, Text, Title, Table, Divider, Button, Center } from '@mantine/core';
import PropTypes from 'prop-types';
import { useRef } from 'react';

import useStore from '../store';
import { formatDisplayName } from '../utils/formatters';

/**
 * SupplierBillPreview Component
 * Receipt-style preview for printing supplier bills.
 * Implements FR-SUPBILL-010 through FR-SUPBILL-017.
 *
 * @param {Object} previewData - Preview data from form
 */
function SupplierBillPreview({ previewData }) {
  const printRef = useRef();
  const isUr = useStore((s) => s.language === 'ur');

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Print handler
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supplier Bill</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, sans-serif; 
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: right;
          }
          th { 
            background-color: #f5f5f5; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px;
          }
          .urdu { 
            font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', sans-serif;
            direction: rtl;
          }
          .summary-row {
            font-weight: bold;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!previewData) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder h="100%">
        <Center h={300}>
          <Stack align="center" gap="md">
            <Text size="4rem">📋</Text>
            <Text c="dimmed" size="lg">
              Select supplier and date range, then click &quot;Go&quot; to generate preview
            </Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  const { items, totalWeight, grossAmount, dateFrom, dateTo } = previewData;

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Print Button */}
        <Group justify="flex-end">
          <Button variant="light" leftSection={<span>🖨️</span>} onClick={handlePrint}>
            Print Bill
          </Button>
        </Group>

        {/* Printable Content */}
        <div ref={printRef}>
          {/* Company Header */}
          <Stack align="center" gap={4} mb="lg">
            <Title order={2} className="text-blue-800">
              AL - SHEIKH FISH TRADER AND DISTRIBUTER
            </Title>
            <Text size="sm" c="dimmed">
              Shop No. W-644 Gunj Mandi Rawalpindi
            </Text>
            <Text size="sm" c="dimmed">
              +92-3008501724, 051-5534607
            </Text>
            <Divider w="100%" my="xs" />
            <Title order={3} className="urdu" style={{ direction: 'rtl' }}>
              بیوپاری بل
            </Title>
            <Text size="sm">
              {formatDisplayDate(dateFrom)} تا {formatDisplayDate(dateTo)}
            </Text>
            {/* Vehicle Numbers (FR-SUPBILL-017) */}
            {items &&
              (() => {
                const vehicles = [...new Set(items.map((i) => i.vehicle_number).filter(Boolean))];
                return vehicles.length > 0 ? (
                  <Text size="sm" c="dimmed">
                    گاڑی نمبر (Vehicle): {vehicles.join(', ')}
                  </Text>
                ) : null;
              })()}
          </Stack>

          {/* Items Table */}
          {items && items.length > 0 ? (
            <Table striped highlightOnHover withTableBorder withColumnBorders mb="lg">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: 'center' }}>#</Table.Th>
                  <Table.Th>Item / قسم</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Vehicle #</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Date</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Weight (kg)</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Rate</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item, index) => (
                  <Table.Tr key={item.id}>
                    <Table.Td style={{ textAlign: 'center' }}>{index + 1}</Table.Td>
                    <Table.Td>
                      {formatDisplayName(item.item_name, item.item_name_english, isUr)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{item.vehicle_number || '-'}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {formatDisplayDate(item.sale_date)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {(item.weight || 0).toFixed(2)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {(item.rate || 0).toFixed(2)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {Math.round(item.amount || 0).toLocaleString('en-US')}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr className="summary-row" style={{ fontWeight: 'bold' }}>
                  <Table.Td colSpan={3} style={{ textAlign: 'right' }}>
                    Total:
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{totalWeight.toFixed(2)} kg</Table.Td>
                  <Table.Td />
                  <Table.Td style={{ textAlign: 'right' }}>Rs. {Math.round(grossAmount).toLocaleString('en-US')}</Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          ) : (
            <Paper p="xl" bg="gray.0" radius="sm">
              <Center>
                <Text c="dimmed">No items found for the selected date range</Text>
              </Center>
            </Paper>
          )}

          {/* Summary Footer */}
          <Paper p="md" bg="blue.0" radius="sm">
            <Group justify="space-between">
              <Stack gap={2}>
                <Text size="sm" c="dimmed">
                  نقل وزن کلوگرام (Total Weight)
                </Text>
                <Text fw={600}>{totalWeight.toFixed(2)} kg</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="sm" c="dimmed">
                  نقل رقم (Gross Amount)
                </Text>
                <Text fw={600}>Rs. {Math.round(grossAmount).toLocaleString('en-US')}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="sm" c="dimmed">
                  Items Count
                </Text>
                <Text fw={600}>{items?.length || 0}</Text>
              </Stack>
            </Group>
          </Paper>
        </div>
      </Stack>
    </Paper>
  );
}

SupplierBillPreview.propTypes = {
  previewData: PropTypes.shape({
    items: PropTypes.array,
    totalWeight: PropTypes.number,
    grossAmount: PropTypes.number,
    supplierId: PropTypes.number,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
  }),
};

export default SupplierBillPreview;
