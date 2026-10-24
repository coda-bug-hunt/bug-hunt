/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Pure logic runs in node; component tests opt in with `// @vitest-environment jsdom`.
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})
