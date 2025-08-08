import { defineConfig } from 'vite'

console.log("Loading vite.config.ts");

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: 'debug.html'
    },
    outDir: 'dist'
  }
})
