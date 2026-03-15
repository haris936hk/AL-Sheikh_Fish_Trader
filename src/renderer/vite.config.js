import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock IPC handler for browser environment
const handleMockIpcRequest = async (req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', async () => {
    try {
      const { channel, args } = JSON.parse(body);
      // We need to require this here because it's CommonJS and might need DB init
      const { handleMockIpc } = require('../main/ipc/mockHandlers.js');
      const result = await handleMockIpc(channel, args);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
};

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname),
  base: './', // CRITICAL: Ensures relative paths in the built app
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mantine': [
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/notifications',
            '@mantine/modals',
            '@mantine/dates',
          ],
          'vendor-icons': ['@tabler/icons-react'],
          'vendor-i18n': ['i18next', 'react-i18next'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {},
    // Add middleware for mock IPC
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/ipc' && req.method === 'POST') {
          handleMockIpcRequest(req, res);
        } else {
          next();
        }
      });
    }
  },
  css: {
    postcss: path.resolve(__dirname, '../../postcss.config.js'),
  },
});
