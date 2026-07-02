import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Needed for Docker container port mapping to work properly
    watch: {
      usePolling: true // Helps with file hot-reloading inside Docker volumes
    }
  }
})
