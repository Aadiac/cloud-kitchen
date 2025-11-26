import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // This MUST match your repo name "/cloud-kitchen/" exactly
  base: '/cloud-kitchen/', 
  server: {
    host: true,
    // This is for your local testing via ngrok, you can keep it
    allowedHosts: ['untugged-forgetfully-ardith.ngrok-free.dev']
  }
})