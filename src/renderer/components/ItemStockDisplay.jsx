import {
  Card,
  Table,
  Text,
  ScrollArea,
  Loader,
  Center,
  Badge,
  Group,
  ThemeIcon,
} from '@mantine/core';
import { IconPackage } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import useStore from '../store';
import { formatDisplayName } from '../utils/formatters';

/**
 * ItemStockDisplay Component
 * Displays a list of items with their current stock quantities.
 * Supports Urdu names with RTL text direction.
 *
 * @param {Array} data - Array of item objects with name, current_stock
 * @param {boolean} loading - Loading state
 */
function ItemStockDisplay({ data = [], loading = false }) {
  const { t } = useTranslation();
  const isUr = useStore((s) => s.language === 'ur');
  // Format quantity with 2 decimal places
  const formatQuantity = (qty) => {
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(qty || 0);
  };

  // Get stock level badge color based on quantity
  const getStockColor = (qty) => {
    if (qty <= 0) return 'red';
    if (qty < 10) return 'yellow';
    return 'green';
  };

  if (loading) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder className="h-full">
        <Center h="100%">
          <Loader size="lg" />
        </Center>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder className="h-full flex flex-col overflow-hidden">
      <div className="flex-none flex flex-col gap-1 mb-3">
        <Group gap="xs">
          <ThemeIcon variant="light" color="teal" size="sm" radius="md">
            <IconPackage size={14} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('dashboard.stockLevels')}
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          {t('item.currentStock')}
        </Text>
      </div>

      <div className="flex-1 overflow-hidden min-h-0 relative border border-gray-200 dark:border-gray-700 rounded-md">
        <ScrollArea className="h-full" type="auto">
          {data.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed" size="sm">
                {t('item.noResults')}
              </Text>
            </Center>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: 'right' }}>{t('common.name')}</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>{t('item.currentStock')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td style={{ textAlign: 'right', direction: isUr ? 'rtl' : 'ltr' }}>
                      <Text fw={500}>{formatDisplayName(item.name, item.name_english, isUr)}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Badge color={getStockColor(item.current_stock)} variant="light" size="lg">
                        {formatQuantity(item.current_stock)}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </div>
    </Card>
  );
}

ItemStockDisplay.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      name_english: PropTypes.string,
      current_stock: PropTypes.number.isRequired,
    })
  ),
  loading: PropTypes.bool,
};

export default ItemStockDisplay;
