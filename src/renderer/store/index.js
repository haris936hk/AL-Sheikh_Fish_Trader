import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Main application store using Zustand
 */
const useStore = create(
  devtools(
    (set, _get) => ({
      // App state
      theme: 'light',
      language: 'en',
      loading: false,
      error: null,

      // Dashboard state
      supplierAdvances: [],
      itemsStock: [],
      dashboardSummary: null,
      dashboardLoading: false,

      // Actions
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Load settings from database
      loadSettings: async () => {
        try {
          if (!window.api)
            throw new Error('Electron API not available. Please run the app via Electron.');
          set({ loading: true });
          const result = await window.api.settings.getAll();

          if (result.success) {
            const settings = {};
            result.data.forEach((row) => {
              settings[row.key] = row.value;
            });

            set({
              theme: settings.app_theme || 'light',
              language: settings.app_language || 'en',
              loading: false,
            });
          }
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // Save settings to database
      saveSetting: async (key, value) => {
        try {
          if (!window.api) throw new Error('Electron API not available.');
          const result = await window.api.settings.save(key, value);

          if (!result.success) {
            throw new Error(result.error);
          }
        } catch (error) {
          set({ error: error.message });
        }
      },

      // Dashboard actions
      loadDashboardData: async () => {
        try {
          if (!window.api)
            throw new Error('Electron API not available. Please run the app via Electron.');
          set({ dashboardLoading: true });

          // Fetch all dashboard data in parallel
          const [advancesResult, stockResult, summaryResult] = await Promise.all([
            window.api.dashboard.getSupplierAdvances(),
            window.api.dashboard.getItemsStock(),
            window.api.dashboard.getSummary(),
          ]);

          set({
            supplierAdvances: advancesResult.success ? advancesResult.data : [],
            itemsStock: stockResult.success ? stockResult.data : [],
            dashboardSummary: summaryResult.success ? summaryResult.data : null,
            dashboardLoading: false,
          });
        } catch (error) {
          console.error('Failed to load dashboard data:', error);
          set({
            error: error.message,
            dashboardLoading: false,
          });
          // Show error notification
          import('@mantine/notifications')
            .then(({ notifications }) => {
              notifications.show({
                title: 'Dashboard Error',
                message: `Failed to load dashboard data: ${error.message}`,
                color: 'red',
              });
              return null;
            })
            .catch((err) => {
              console.error('Failed to load notifications module:', err);
            });
        }
      },

      refreshSupplierAdvances: async () => {
        try {
          if (!window.api) return;
          const result = await window.api.dashboard.getSupplierAdvances();
          if (result.success) {
            set({ supplierAdvances: result.data });
          }
        } catch (error) {
          console.error('Failed to refresh supplier advances:', error);
        }
      },

      refreshItemsStock: async () => {
        try {
          if (!window.api) return;
          const result = await window.api.dashboard.getItemsStock();
          if (result.success) {
            set({ itemsStock: result.data });
          }
        } catch (error) {
          console.error('Failed to refresh items stock:', error);
        }
      },
    }),
    { name: 'app-store' }
  )
);

export default useStore;
