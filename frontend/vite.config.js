/**
 * vite.config.js
 *
 * Vite configuration for the MemoryWeave React SPA.
 */

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://127.0.0.1:8000'

  return {
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'inject-vite-api-url',
      transformIndexHtml(html) {
        return html.replaceAll('%VITE_API_URL%', apiUrl)
      },
    },
  ],
  server: {
    port: 5173,
    open: false,
  },
  }
})
