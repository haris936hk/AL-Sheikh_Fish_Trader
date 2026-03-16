import {
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
import { modals } from '@mantine/modals';
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
import { useState, useEffect, useCallback } from 'react';
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

  const loadSettings = useCallback(async () => {
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
        title: t('error.title'),
        message: t('settings.error'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
        title: t('app.update'),
        message: t('settings.saved'),
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch {
      notifications.show({
        title: t('error.title'),
        message: t('settings.error'),
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
          title: t('settings.backupCreated'),
          message: `${t('settings.backupCreated')}: ${result.data.path}`,
          color: 'green',
        });
        loadBackups();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      notifications.show({
        title: t('settings.backupFailed'),
        message: error.message,
        color: 'red',
      });
    }
  };

  const handleRestoreBackup = async (filePath) => {
    modals.openConfirmModal({
      title: t('settings.backup'),
      children: <Text size="sm">{t('settings.restoreConfirm')}</Text>,
      labels: { confirm: t('common.confirm'), cancel: t('app.cancel') },
      onConfirm: async () => {
        try {
          const result = await window.api.backup.restore(filePath);
          if (result.success) {
            notifications.show({
              title: t('settings.restoreComplete'),
              message: t('settings.restoreMsg'),
              color: 'green',
            });
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          notifications.show({
            title: t('settings.error'),
            message: error.message,
            color: 'red',
          });
        }
      },
    });
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return `0 ${t('settings.bytes')}`;
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = [
      t('settings.bytes'),
      t('settings.kb'),
      t('settings.mb'),
      t('settings.gb'),
      t('settings.tb'),
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatDate = (dateStr) => {
    const dt = new Date(dateStr);
    return dt.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto w-full h-full flex flex-col overflow-hidden relative">
        <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />

        <Group justify="space-between" mb="sm" className="flex-none">
          <Title order={3}>
            <Group gap="xs">
              <IconSettings size={24} />
              {t('settings.title')}
            </Group>
          </Title>
          <Button size="sm" leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving}>
            {t('settings.save')}
          </Button>
        </Group>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onChange={setActiveTab} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Tabs.List style={{ flex: 'none' }}>
              <Tabs.Tab value="company" leftSection={<IconBuilding size={16} />}>
                {t('settings.company')}
              </Tabs.Tab>
              <Tabs.Tab value="business" leftSection={<IconSettings size={16} />}>
                {t('settings.businessSettings')}
              </Tabs.Tab>
              <Tabs.Tab value="backup" leftSection={<IconDatabase size={16} />}>
                {t('settings.backup')}
              </Tabs.Tab>
              <Tabs.Tab value="sms" leftSection={<IconMessage size={16} />}>
                {t('settings.sms')}
              </Tabs.Tab>
              <Tabs.Tab value="yearend" leftSection={<IconCalendarTime size={16} />}>
                {t('settings.yearEnd')}
              </Tabs.Tab>
            </Tabs.List>

            <Paper p="md" mt="sm" withBorder style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative' }}>
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
                  <Title order={4}>{t('settings.businessSettings')}</Title>
                  <Divider />

                  <Grid>
                    <Grid.Col span={4}>
                      <NumberInput
                        label={t('settings.defaultCommission')}
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
                        label={t('settings.defaultVAT')}
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
                        label={t('settings.allowNegativeStock')}
                        description={t('settings.allowNegativeStockDesc')}
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
                  <Title order={4}>{t('settings.backup')}</Title>
                  <Divider />

                  <Alert color="blue" variant="light">
                    {t('settings.backupProtect')}
                  </Alert>

                  <Group>
                    <Button
                      leftSection={<IconDownload size={16} />}
                      onClick={handleCreateBackup}
                      color="green"
                    >
                      {t('settings.createBackup')}
                    </Button>
                    <Button
                      leftSection={<IconRefresh size={16} />}
                      variant="outline"
                      onClick={loadBackups}
                    >
                      {t('settings.refreshList')}
                    </Button>
                  </Group>

                  <Title order={5} mt="md">
                    {t('settings.availableBackups')}
                  </Title>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('settings.filename')}</Table.Th>
                        <Table.Th>{t('settings.size')}</Table.Th>
                        <Table.Th>{t('settings.created')}</Table.Th>
                        <Table.Th>{t('settings.actions')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {backups.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={4}>
                            <Text c="dimmed" ta="center">
                              {t('settings.noBackups')}
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
                                title={t('common.confirm')}
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
                  <Title order={4}>{t('settings.sms')}</Title>
                  <Divider />

                  <Switch
                    label={t('settings.smsEnabled')}
                    description={t('settings.smsEnabledDesc')}
                    checked={settings.sms_enabled}
                    onChange={(e) => handleChange('sms_enabled', e.currentTarget.checked)}
                  />

                  {settings.sms_enabled && (
                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label={t('settings.smsGatewayUrl')}
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
                          label={t('settings.smsApiKey')}
                          value={settings.sms_api_key}
                          onChange={(e) => handleChange('sms_api_key', e.target.value)}
                          placeholder={t('settings.smsApiKeyPh')}
                          type="password"
                          className="ltr-field"
                          dir="ltr"
                          styles={{ input: { textAlign: 'left' } }}
                        />
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Textarea
                          label={t('settings.smsTemplate')}
                          description={t('settings.smsTemplateDesc')}
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
                  <Title order={4}>{t('settings.yearEnd')}</Title>
                  <Divider />

                  <Alert color="orange" variant="light">
                    <Text size="sm">
                      {t('settings.yearEndDesc')}
                    </Text>
                  </Alert>

                  {yearEndHistory && (
                    <Alert color="blue" variant="light">
                      <Text size="sm">
                        {t('settings.lastRefresh')}:{' '}
                        {formatDate(yearEndHistory.last_date)}
                        {' '} {t('report.to')} {new Date(yearEndHistory.updated_at).toLocaleString()}
                      </Text>
                    </Alert>
                  )}

                  <Grid align="flex-end">
                    <Grid.Col span={4}>
                      <DatePickerInput
                        label={t('settings.yearEndDate')}
                        description={t('settings.yearEndDateDesc')}
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
                              (yearEndDate instanceof Date ? yearEndDate : new Date(yearEndDate)).toISOString().split('T')[0]
                            );
                            if (result.success) {
                              setYearEndPreview(result.data);
                            } else {
                              throw new Error(result.error);
                            }
                          } catch (error) {
                            notifications.show({
                              title: t('error.title'),
                              message: error.message,
                              color: 'red',
                            });
                          } finally {
                            setYearEndLoading(false);
                          }
                        }}
                        loading={yearEndLoading}
                      >
                        {t('settings.generatePreview')}
                      </Button>
                    </Grid.Col>
                  </Grid>

                  {yearEndPreview && (
                    <Stack mt="md">
                      <Title order={5}>{t('settings.previewSummary')}</Title>
                      <Grid>
                        <Grid.Col span={6}>
                          <Paper p="md" withBorder>
                            <Text fw={500}>{t('settings.customerBalances')}</Text>
                            <Text size="sm" c="dimmed">
                              {yearEndPreview.summary.customerCount} {t('nav.customers')}
                            </Text>
                            <Text size="lg" fw={700} c="blue">
                              {Math.round(yearEndPreview.summary.totalCustomerBalance).toLocaleString(isUrdu ? 'ur-PK' : 'en-US')}
                            </Text>
                          </Paper>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Paper p="md" withBorder>
                            <Text fw={500}>{t('settings.vendorBalances')}</Text>
                            <Text size="sm" c="dimmed">
                              {yearEndPreview.summary.supplierCount} {t('nav.suppliers')}
                            </Text>
                            <Text size="lg" fw={700} c="green">
                              {Math.round(yearEndPreview.summary.totalSupplierBalance).toLocaleString(isUrdu ? 'ur-PK' : 'en-US')}
                            </Text>
                          </Paper>
                        </Grid.Col>
                      </Grid>

                      <Button
                        color="red"
                        onClick={async () => {
                          modals.openConfirmModal({
                            title: t('settings.yearEnd'),
                            children: <Text size="sm">{t('settings.yearEndConfirm')}</Text>,
                            labels: { confirm: t('settings.processYearEnd'), cancel: t('app.cancel') },
                            onConfirm: async () => {
                              setYearEndLoading(true);
                              try {
                                const result = await window.api.yearEnd.process(
                                  (yearEndDate instanceof Date ? yearEndDate : new Date(yearEndDate)).toISOString().split('T')[0]
                                );
                                if (result.success) {
                                  notifications.show({
                                    title: t('settings.yearEndSuccess'),
                                    message: t('settings.yearEndSuccessMsg', {
                                      customers: result.data.customersUpdated,
                                      suppliers: result.data.suppliersUpdated
                                    }),
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
                                  title: t('error.title'),
                                  message: error.message,
                                  color: 'red',
                                });
                              } finally {
                                setYearEndLoading(false);
                              }
                            },
                          });
                        }}
                        loading={yearEndLoading}
                      >
                        {t('settings.processYearEnd')}
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Tabs.Panel>
            </Paper>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default Settings;
