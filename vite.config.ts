
import { defineConfig } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve:{
    alias:{
      'blueprint3d' : path.resolve(__dirname, './src/blueprint3d.ts')
    },
  },
  server: {
    port: 8080,
    open: '/example/index.html'
  },
  build: {
    rollupOptions: {
      input: {
        app: './example/index.html'
      },
    }
  }
})
