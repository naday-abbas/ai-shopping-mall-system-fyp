import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: '../testing/frontend/setup.ts',
    include: ['../testing/frontend/**/*.test.{ts,tsx}'],
  },
})
