import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { APP_BUILD } from './src/lib/appVersion.js'

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD__: JSON.stringify(APP_BUILD)
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@xyflow') || id.includes('@dagrejs')) return 'xyflow'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('socket.io-client')) return 'socket'
          if (id.includes('html2pdf')) return 'pdf'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router')) {
            return 'react'
          }
          if (id.includes('node_modules')) return 'vendor'
        }
      }
    }
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
