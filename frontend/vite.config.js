import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { APP_BUILD } from './src/lib/appVersion.js'

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD__: JSON.stringify(APP_BUILD)
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
