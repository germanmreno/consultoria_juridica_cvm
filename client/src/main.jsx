import '@fontsource/georama/400.css';
import '@fontsource/georama/500.css';
import '@fontsource/georama/600.css';
import '@fontsource/georama/700.css';
import '@mantine/core/styles.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { theme } from './theme';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
        <AuthProvider>
          <App />
        </AuthProvider>
      </MantineProvider>
    </BrowserRouter>
  </StrictMode>,
);
