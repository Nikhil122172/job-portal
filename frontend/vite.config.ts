import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Raise chunk size warning threshold to 600 KB (default 500 KB)
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting for smaller initial load
    cssCodeSplit: true,
    // Source maps only in development — not in Docker production build
    sourcemap: false,
    // Minify with esbuild (default, fast) — switch to 'terser' for max compression
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Split vendor bundles by logical grouping so unchanged libs stay cached
        manualChunks: {
          // Core React runtime — almost never changes
          vendor: ['react', 'react-dom'],
          // Router — changes with React Router upgrades only
          router: ['react-router-dom'],
          // State management — changes with Redux upgrades only
          redux: ['@reduxjs/toolkit', 'react-redux'],
          // HTTP + form utilities — group together as both are request/data related
          http: ['axios', 'react-hook-form', '@hookform/resolvers', 'zod'],
          // UI utilities — icon lib is large; isolate so code changes don't invalidate it
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
          // Date utilities
          utils: ['date-fns'],
        },
      },
    },
  },
})

