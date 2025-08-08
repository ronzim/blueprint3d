import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/blueprint3d.ts',
      name: 'BP3D',
      fileName: (format) => `blueprint3d.${format}.js`
    },
    outDir: 'dist'
  }
})
