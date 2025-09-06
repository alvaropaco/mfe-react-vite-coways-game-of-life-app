import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8080'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: '@gol/shell',
      filename: 'remoteEntry.js',
      exposes: {},
      // Use envs to allow dynamic ports during dev (when preview auto-picks free ports)
      remotes: {
        board_mfe: (process.env.BOARD_REMOTE as string) || 'http://localhost:5174/assets/remoteEntry.js',
        controls_mfe: (process.env.CONTROLS_REMOTE as string) || 'http://localhost:5175/assets/remoteEntry.js'
      },
      shared: [
        'react',
        'react-dom',
        '@tanstack/react-query'
      ]
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: BACKEND,
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: { port: 3000 },
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
