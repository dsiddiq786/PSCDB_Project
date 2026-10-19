import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, API calls go to the local backend.
    proxy: {
      '/api': { target: 'http://localhost:3002', changeOrigin: false },
    },
  },
})
