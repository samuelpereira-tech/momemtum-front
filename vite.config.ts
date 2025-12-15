/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    env: {
      VITE_AUTH_SERVICE_PROVIDER: 'localhost',
      VITE_API_BASE_URL: 'http://localhost:3000',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
})
