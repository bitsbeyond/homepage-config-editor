import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { MetadataProvider } from './contexts/MetadataContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <MetadataProvider>
        <App />
      </MetadataProvider>
    </ThemeProvider>
  </StrictMode>,
)
