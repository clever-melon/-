import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Shim global process.env
    'process.env': {},
    
    // Inject API_KEY for client-side usage
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
});