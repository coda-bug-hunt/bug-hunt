/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same job as nginx on the stand: the browser calls /api on this port,
    // Vite forwards it to the API. No CORS in dev.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  test: {
    // Pure logic runs in node; component tests opt in with `// @vitest-environment jsdom`.
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})
