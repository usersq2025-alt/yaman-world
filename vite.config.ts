import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ base: './', plugins: [react()], preview: { allowedHosts: true },
  server: { port: 5180, host: true } });

