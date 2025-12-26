import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
// Remove Monaco Editor plugin import for now, rely on @monaco-editor/react
// import monacoEditorPlugin from 'vite-plugin-monaco-editor';

// Read homepage version
const homepageVersionPath = path.resolve(__dirname, '../homepageversion.txt'); // Corrected path
const homepageCompatibleVersion = fs.existsSync(homepageVersionPath) ? fs.readFileSync(homepageVersionPath, 'utf-8').trim() : 'N/A';

// Read app version from frontend's package.json
const packageJsonPath = path.resolve(__dirname, './package.json');
let appVersion = '0.0.0'; // Default fallback
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJsonContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    appVersion = packageJsonContent.version || '0.0.0';
  } catch (error) {
    console.error('Failed to parse frontend/package.json:', error);
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Expose the app version from package.json to the app code
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_HOMEPAGE_COMPATIBLE_VERSION': JSON.stringify(homepageCompatibleVersion)
  },
  plugins: [
    react(),
    // Remove Monaco Editor plugin usage for now
    // monacoEditorPlugin({
    //   languageWorkers: ['editorWorkerService', 'yaml', 'css', 'json', 'javascript', 'typescript'],
    // }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled']
  },
  server: {
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://127.0.0.1:3000', // Your backend server address (IPv4 explicit)
        changeOrigin: true, // Recommended for virtual hosted sites
        // secure: false, // Uncomment if backend uses self-signed HTTPS cert
        // rewrite: (path) => path.replace(/^\/api/, ''), // Uncomment if backend doesn't expect /api prefix
      },
    },
  },
})
