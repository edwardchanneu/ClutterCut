import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/renderer/src/test-setup.ts'],
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src')
    },
    exclude: ['e2e/**', 'node_modules/**']
  }
})
