import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all /api requests to the Render backend (fixes CORS in local dev)
      '/api': {
        target: 'https://collasphere.onrender.com',
        changeOrigin: true,
        secure: false, // Helps in some network/dev environments
        timeout: 60000, // Increase timeout to 60s
        proxyTimeout: 60000,
      },
      '/uploads': {
        target: 'https://collasphere.onrender.com',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
      },
    },
  },
})
