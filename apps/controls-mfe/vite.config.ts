import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: '@gol/controls-mfe',
      filename: 'remoteEntry.js',
      exposes: {"./Controls": "./src/Controls.tsx"},
      remotes: {},
      shared: [
        'react',
        'react-dom',
        '@tanstack/react-query'
      ]
    })
  ],
  server: { port: 5175 },
  preview: { port: 5175 },
  build: {
    target: 'esnext',
    modulePreload: true
  },
  optimizeDeps: {
    esbuildOptions: {
      supported: { 'top-level-await': true }
    }
  }
})
