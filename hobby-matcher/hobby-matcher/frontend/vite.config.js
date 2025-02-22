import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    host: true, // Allow external access
  },

  preview: {
    allowedHosts: ['hobby-matcher-9-a0oh.onrender.com'],
  }

})