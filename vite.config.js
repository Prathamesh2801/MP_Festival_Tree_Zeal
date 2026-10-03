import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import config from './src/config/config.js'

const api = new URL(config.apiBase)

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true, // reachable from tablets on the LAN
    // Dev only: the app runs on https (camera needs it) but the dev API is plain http,
    // so API calls go through this proxy. Production builds call config.apiBase directly.
    proxy: { [api.pathname]: { target: api.origin, changeOrigin: true } },
  },
})
