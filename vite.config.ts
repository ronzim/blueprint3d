import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig({
  root: 'example', // Change root to example directory
  base: './',
  
  build: {
    outDir: '../dist',
    manifest: true,
    // Configure dual build modes:
    // 1. Library mode for blueprint3d.ts
    // 2. Application mode for the example app
    lib: {
      entry: resolve(__dirname, 'src/blueprint3d.ts'),
      name: 'Blueprint3d',
      fileName: 'blueprint3d',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['jquery', 'three', 'bootstrap'],
      output: {
        globals: {
          jquery: 'jQuery',
          three: 'THREE',
          bootstrap: 'bootstrap'
        },
        // Ensure proper asset paths
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js'
      }
    },
    // Ensure assets are copied to the correct location
    assetsDir: 'assets',
    emptyOutDir: false
  },

  server: {
    open: true,
    // Improve HMR in development
    hmr: {
      overlay: true
    }
  },

  plugins: [
    legacy({
      targets: ['ie >= 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],

  resolve: {
    alias: {
      // Create easier import paths
      '@': resolve(__dirname, 'src'),
      '@example': resolve(__dirname, 'example'),
      // Important: create an alias for blueprint3d to fix the import path issues
      'blueprint3d': resolve(__dirname, 'src/blueprint3d.ts')
    },
    // Ensure TypeScript files are properly resolved
    extensions: ['.ts', '.js', '.json']
  },

  // Handle static assets
  publicDir: resolve(__dirname, 'example/public'),
  
  assetsInclude: [
    '**/*.gltf', 
    '**/*.glb', 
    '**/*.jpg', 
    '**/*.png', 
    '**/*.woff', 
    '**/*.woff2', 
    '**/*.ttf', 
    '**/*.eot',
    '**/*.js',
    '**/*.json'
  ],
  
  // Improve development experience with better error reporting
  css: {
    devSourcemap: true
  },
  
  // Enable source maps for better debugging
  optimizeDeps: {
    include: ['jquery', 'three', 'bootstrap']
  }
});
