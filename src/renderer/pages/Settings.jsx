import {
  Container,
  Title,
  Tabs,
  Paper,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Grid,
  Switch,
  NumberInput,
  Divider,
  Text,
  Table,
  ActionIcon,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  IconSettings,
  IconBuilding,
  IconDeviceFloppy,
  IconRefresh,
  IconDatabase,
  IconDownload,
  IconUpload,
  IconMessage,
  IconCheck,
  IconCalendarTime,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '../store';

function Settings() {
  const { t } = useTranslation();
  const language = useStore((s) => s.language);
  const isUrdu = language === 'ur';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [backups, setBackups] = useState([]);
  const [yearEndDate, setYearEndDate] = useState(new Date());
  const [yearEndPreview, setYearEndPreview] = useState(null);
  const [yearEndHistory, setYearEndHistory] = useState(null);
  const [yearEndLoading, setYearEndLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Company Info
    company_name: '',
    company_name_urdu: '',
    company_address: '',
    company_phone: '',
    company_mobile: '',
    company_email: '',

    // Business Settings
    default_commission_pct: 5,
    default_vat_pct: 0,
    allow_negative_stock: false,

    // SMS Settings
    sms_enabled: false,
    sms_gateway_url: '',
    sms_api_key: '',
    sms_template_sale: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await window.api.settings.getAll();
      if (result.success) {
        // Convert array to object
        const settingsObj = {};
        result.data.forEach((s) => {
          settingsObj[s.key] = s.value;
        });
        setSettings((prev) => ({
          ...prev,
          ...settingsObj,
          // Convert string booleans
          sms_enabled: settingsObj.sms_enabled === 'true',
          allow_negative_stock: settingsObj.allow_negative_stock === 'true',
          // Convert numbers
          default_commission_pct: parseFloat(settingsObj.default_commission_pct) || 5,
          default_vat_pct: parseFloat(settingsObj.default_vat_pct) || 0,
        }));
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to load settings',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      const result = await window.api.backup.list();
      if (result.success) {
        setBackups(result.data);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'backup') {
      loadBackups();
    }
  }, [activeTab]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each setting
      for (const [key, value] of Object.entries(settings)) {
        const stringValue = typeof value === 'boolean' ? String(value) : String(value);
        await window.api.settings.save(key, stringValue);
      }
      notifications.show({
        title: 'Success',
        message: 'Settings saved successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to save settings',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      const result = await window.api.backup.create();
      if (result.success) {
        notifications.show({
          title: 'Backup Created',
          message: `Backup saved to: ${result.data.path}`,
          color: 'green',
        });
        loadBackups();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      notifications.show({
        title: 'Backup Failed',
        message: error.message,
        color: 'red',
      });
    }
  };

  const handleRestoreBackup = async (filePath) => {
    if (
      !window.confirm(
        'Are you sure you want to restore this backup? Current data will be replaced.'
      )
    ) {
      return;
    }
    try {
      const result = await window.api.backup.restore(filePath);
      if (result.success) {
        notifications.show({
          title: 'Restore Complete',
          message: 'Database restored. Please restart the application.',
          color: 'green',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      notifications.show({
        title: 'Restore Failed',
        message: error.message,
        color: 'red',
      });
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Container size="lg" py="md">
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />

      <Group justify="space-between" mb="lg">
        <Title order={2}>
          <Group gap="xs">
            <IconSettings size={28} />
            {t('settings.title')}
          </Group>
        </Title>
        <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving}>
          {t('settings.save')}
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="company" leftSection={<IconBuilding size={16} />}>
            {t('settings.company')}
          </Tabs.Tab>
          <Tabs.Tab value="business" leftSection={<IconSettings size={16} />}>
            {t('settings.language')}
          </Tabs.Tab>
          <Tabs.Tab value="backup" leftSection={<IconDatabase size={16} />}>
            {isUrdu ? 'بیک اپ' : 'Backup & Restore'}
          </Tabs.Tab>
          <Tabs.Tab value="sms" leftSection={<IconMessage size={16} />}>
            {t('settings.sms')}
          </Tabs.Tab>
          <Tabs.Tab value="yearend" leftSection={<IconCalendarTime size={16} />}>
            {isUrdu ? 'سال کا اختتام' : 'Year-End'}
          </Tabs.Tab>
        </Tabs.List>

        <Paper p="md" mt="md" withBorder>
          <Tabs.Panel value="company">
            <Stack>
              <Title order={4}>{t('settings.company')}</Title>
              <Divider />

              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label={t('settings.companyName')}
                    value={settings.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label={t('settings.companyNameUrdu')}
                    value={settings.company_name_urdu}
                    onChange={(e) => handleChange('company_name_urdu', e.target.value)}
                    dir="rtl"
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label={t('settings.address')}
                    value={settings.company_address}
                    onChange={(e) => handleChange('company_address', e.target.value)}
                    minRows={2}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label={t('settings.phone')}
                    value={settings.company_phone}
                    onChange={(e) => handleChange('company_phone', e.target.value)}
                    placeholder="051-1234567"
                    className="ltr-field"
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label={t('settings.mobile')}
                    value={settings.company_mobile}
                    onChange={(e) => handleChange('company_mobile', e.target.value)}
                    placeholder="03001234567"
                    className="ltr-field"
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label={t('settings.email')}
                    value={settings.company_email}
                    onChange={(e) => handleChange('company_email', e.target.value)}
                    placeholder="info@company.com"
                    className="ltr-field"
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="business">
            <Stack>
              <Title order={4}>Business Settings / کاروباری ترتیبات</Title>
              <Divider />

              <Grid>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Default Commission %"
                    value={settings.default_commission_pct}
                    onChange={(value) =>
                      handleChange('default_commission_pct', value === '' ? '' : value)
                    }
                    min={0}
                    max={100}
                    decimalScale={2}
                    suffix="%"
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Default VAT %"
                    value={settings.default_vat_pct}
                    onChange={(value) => handleChange('default_vat_pct', value === '' ? '' : value)}
                    min={0}
                    max={100}
                    decimalScale={2}
                    suffix="%"
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Switch
                    label="Allow Negative Stock"
                    description="Allow sales when stock is insufficient"
                    checked={settings.allow_negative_stock}
                    onChange={(e) => handleChange('allow_negative_stock', e.currentTarget.checked)}
                    mt="md"
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="backup">
            <Stack>
              <Title order={4}>Backup & Restore / بیک اپ اور بحالی</Title>
              <Divider />

              <Alert color="blue" variant="light">
                Create regular backups to protect your data. Backups are saved in the application
                data folder.
              </Alert>

              <Group>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleCreateBackup}
                  color="green"
                >
                  Create Backup Now
                </Button>
                <Button
                  leftSection={<IconRefresh size={16} />}
                  variant="outline"
                  onClick={loadBackups}
                >
                  Refresh List
                </Button>
              </Group>

              <Title order={5} mt="md">
                Available Backups
              </Title>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Filename</Table.Th>
                    <Table.Th>Size</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {backups.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={4}>
                        <Text c="dimmed" ta="center">
                          No backups found
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    backups.map((backup, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>{backup.name}</Table.Td>
                        <Table.Td>{formatBytes(backup.size)}</Table.Td>
                        <Table.Td>{new Date(backup.created).toLocaleString()}</Table.Td>
                        <Table.Td>
                          <ActionIcon
                            color="blue"
                            variant="light"
                            onClick={() => handleRestoreBackup(backup.path)}
                            title="Restore this backup"
                          >
                            <IconUpload size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="sms">
            <Stack>
              <Title order={4}>SMS Settings / ایس ایم ایس ترتیبات</Title>
              <Divider />

              <Switch
                label="Enable SMS Notifications"
                description="Send SMS to customers after sales"
                checked={settings.sms_enabled}
                onChange={(e) => handleChange('sms_enabled', e.currentTarget.checked)}
              />

              {settings.sms_enabled && (
                <Grid>
                  <Grid.Col span={6}>
                    <TextInput
                      label="SMS Gateway URL"
                      value={settings.sms_gateway_url}
                      onChange={(e) => handleChange('sms_gateway_url', e.target.value)}
                      placeholder="https://api.smsgateway.com/send"
                      className="ltr-field"
                      dir="ltr"
                      styles={{ input: { textAlign: 'left' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="API Key"
                      value={settings.sms_api_key}
                      onChange={(e) => handleChange('sms_api_key', e.target.value)}
                      placeholder="Your API key"
                      type="password"
                      className="ltr-field"
                      dir="ltr"
                      styles={{ input: { textAlign: 'left' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Textarea
                      label="Sale SMS Template"
                      description="Use {customer_name}, {amount}, {sale_number} as placeholders"
                      value={settings.sms_template_sale}
                      onChange={(e) => handleChange('sms_template_sale', e.target.value)}
                      placeholder="Dear {customer_name}, your sale #{sale_number} of Rs. {amount} has been recorded."
                      minRows={3}
                    />
                  </Grid.Col>
                </Grid>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="yearend">
            <Stack>
              <Title order={4}>Year-End Processing / سال کے اختتام کی کارروائی</Title>
              <Divider />

              <Alert color="orange" variant="light">
                <Text size="sm">
                  Year-end processing will calculate closing balances as of the selected date and
                  update opening balances for the new year. Historical data is preserved.
                </Text>
              </Alert>

              {yearEndHistory && (
                <Alert color="blue" variant="light">
                  <Text size="sm">
                    Last year-end processed:{' '}
                    {new Date(yearEndHistory.last_date).toLocaleDateString('en-GB')}
                    on {new Date(yearEndHistory.updated_at).toLocaleString()}
                  </Text>
                </Alert>
              )}

              <Grid align="flex-end">
                <Grid.Col span={4}>
                  <DatePickerInput
                    label="Year-End Date"
                    description="Typically December 31st"
                    value={yearEndDate}
                    onChange={setYearEndDate}
                    maxDate={new Date()}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Button
                    onClick={async () => {
                      setYearEndLoading(true);
                      try {
                        const result = await window.api.yearEnd.getPreview(
                          yearEndDate.toISOString().split('T')[0]
                        );
                        if (result.success) {
                          setYearEndPreview(result.data);
                        } else {
                          throw new Error(result.error);
                        }
                      } catch (error) {
                        notifications.show({
                          title: 'Error',
                          message: error.message,
                          color: 'red',
                        });
                      } finally {
                        setYearEndLoading(false);
                      }
                    }}
                    loading={yearEndLoading}
                  >
                    Generate Preview
                  </Button>
                </Grid.Col>
              </Grid>

              {yearEndPreview && (
                <Stack mt="md">
                  <Title order={5}>Preview Summary</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Paper p="md" withBorder>
                        <Text fw={500}>Customer Balances</Text>
                        <Text size="sm" c="dimmed">
                          {yearEndPreview.summary.customerCount} customers
                        </Text>
                        <Text size="lg" fw={700} c="blue">
                          Rs. {Math.round(yearEndPreview.summary.totalCustomerBalance).toLocaleString('en-US')}
                        </Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Paper p="md" withBorder>
                        <Text fw={500}>Vendor Advance Balances</Text>
                        <Text size="sm" c="dimmed">
                          {yearEndPreview.summary.supplierCount} vendors
                        </Text>
                        <Text size="lg" fw={700} c="green">
                          Rs. {Math.round(yearEndPreview.summary.totalSupplierBalance).toLocaleString('en-US')}
                        </Text>
                      </Paper>
                    </Grid.Col>
                  </Grid>

                  <Button
                    color="red"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          'Are you sure you want to process year-end closing? ' +
                          'This will update opening balances for all customers and vendors. ' +
                          'This action cannot be undone easily.'
                        )
                      ) {
                        return;
                      }
                      setYearEndLoading(true);
                      try {
                        const result = await window.api.yearEnd.process(
                          yearEndDate.toISOString().split('T')[0]
                        );
                        if (result.success) {
                          notifications.show({
                            title: 'Year-End Processed',
                            message: `Updated ${result.data.customersUpdated} customers and ${result.data.suppliersUpdated} vendors`,
                            color: 'green',
                            icon: <IconCheck size={16} />,
                          });
                          setYearEndPreview(null);
                          // Refresh history
                          const histResult = await window.api.yearEnd.getHistory();
                          if (histResult.success) {
                            setYearEndHistory(histResult.data);
                          }
                        } else {
                          throw new Error(result.error);
                        }
                      } catch (error) {
                        notifications.show({
                          title: 'Error',
                          message: error.message,
                          color: 'red',
                        });
                      } finally {
                        setYearEndLoading(false);
                      }
                    }}
                    loading={yearEndLoading}
                  >
                    Process Year-End Closing
                  </Button>
                </Stack>
              )}
            </Stack>
          </Tabs.Panel>
        </Paper>
      </Tabs>
    </Container>
  );
}

export default Settings;
