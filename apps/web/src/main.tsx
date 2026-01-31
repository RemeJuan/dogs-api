import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { theme } from '@web/theme/theme';

import App from '@web/app/app';
import { SWRProvider } from '@web/network/swr.client';
import { AuthProvider } from '@web/context/auth.context';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <CssVarsProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <SWRProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SWRProvider>
      </BrowserRouter>
    </CssVarsProvider>
  </StrictMode>,
);
