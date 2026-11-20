import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GTM ID - defaults to your ID, override with env var in production
const gtmId = process.env.VITE_GTM_ID || 'G-EREBWKQ0YF';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_GTM_ID': JSON.stringify(gtmId),
    'process.env.VITE_GTM_ID': JSON.stringify(gtmId),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },
});
