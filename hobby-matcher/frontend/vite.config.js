import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
 
    server: {
      host: true, // or specify the exact host
      preview: {
        allowedHosts: ['https://hobby-matcher-7-s60w.onrender.com'],
      }
    }

})

