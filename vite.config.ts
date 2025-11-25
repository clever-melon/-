import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Allows usage of process.env.API_KEY in the browser code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
});