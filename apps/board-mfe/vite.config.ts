import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: '@gol/board-mfe',
      filename: 'remoteEntry.js',
      exposes: {"./Board": "./src/Board.tsx"},
      remotes: {},
      shared: [
        'react',
        'react-dom',
        '@tanstack/react-query'
      ]
    })
  ],
  server: { port: 5174 },
  preview: { port: 5174 },
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
