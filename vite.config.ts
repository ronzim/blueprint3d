import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: 'example/index.html'
    }
  },
  server: {
    port: 5173
  }
})
