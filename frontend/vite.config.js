import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Requests to /api go to the Spring Boot server, so the browser never hits CORS issues in dev.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8080' } },
});
