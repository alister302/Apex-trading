import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  optimizeDeps: {
    esbuildOptions: {
      charset: 'utf8',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        landing: './public/index-landing.html'
      }
    }
  }
})
