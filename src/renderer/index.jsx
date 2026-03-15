import './ipcMock.js';
import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from './components';
import './index.css';
import './i18n/index.js';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
