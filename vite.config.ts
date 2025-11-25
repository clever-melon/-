import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // CRITICAL FIX: Shim global process.env to prevent "ReferenceError: process is not defined"
    // This allows the app to load even if dependencies try to access process.env
    'process.env': {},
    
    // Inject the specific API KEY
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
});