import {
  Card,
  Table,
  Text,
  Stack,
  ScrollArea,
  Loader,
  Center,
  Group,
  ThemeIcon,
} from '@mantine/core';
import { IconListDetails } from '@tabler/icons-react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import useStore from '../store';
import { formatDisplayName } from '../utils/formatters';

/**
 * SupplierAdvancesList Component
 * Displays a list of suppliers with their outstanding advance amounts.
 * Supports Urdu names and RTL text direction.
 *
 * @param {Array} data - Array of supplier objects with name, advance_amount
 * @param {boolean} loading - Loading state
 * @param {function} onRefresh - Optional callback to refresh data
 */
// eslint-disable-next-line no-unused-vars
function SupplierAdvancesList({ data = [], loading = false, onRefresh }) {
  const { t } = useTranslation();
  const isUr = useStore((s) => s.language === 'ur');
  // Format currency with 2 decimal places
  const formatAmount = (amount) => {
    return Math.round(amount || 0).toLocaleString('en-US');
  };

  if (loading) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder h={300}>
        <Center h="100%">
          <Loader size="lg" />
        </Center>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="xs">
        <Group gap="xs">
          <ThemeIcon variant="light" color="blue" size="sm" radius="md">
            <IconListDetails size={14} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('dashboard.supplierAdvances')}
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          {t('supplier.advanceAmount')}
        </Text>

        <ScrollArea h={220} type="auto">
          {data.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed" size="sm">
                {t('supplier.noResults')}
              </Text>
            </Center>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: 'right' }}>{t('common.name')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>{t('supplier.advanceAmount')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((supplier) => (
                  <Table.Tr key={supplier.id}>
                    <Table.Td style={{ textAlign: 'right', direction: isUr ? 'rtl' : 'ltr' }}>
                      <Text fw={500}>{formatDisplayName(supplier.name, supplier.name_english, isUr)}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text fw={600} c="blue">
                        Rs. {formatAmount(supplier.advance_amount)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </Stack>
    </Card>
  );
}

SupplierAdvancesList.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      name_english: PropTypes.string,
      advance_amount: PropTypes.number.isRequired,
    })
  ),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

export default SupplierAdvancesList;
