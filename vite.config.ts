import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          plugins: [
            {
              name: 'copy-templates',
              writeBundle() {
                const templatesDir = path.join(__dirname, 'src', 'templates')
                const outputDir = path.join(__dirname, 'dist-electron', 'templates')
                if (!fs.existsSync(outputDir)) {
                  fs.mkdirSync(outputDir, { recursive: true })
                }
                const files = fs.readdirSync(templatesDir)
                for (const file of files) {
                  fs.copyFileSync(
                    path.join(templatesDir, file),
                    path.join(outputDir, file),
                  )
                }
              },
            },
          ],
          build: {
            rollupOptions: {
              external: ['node:sqlite', 'node-xlsx'],
            },
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: process.env.NODE_ENV === 'test'
        // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
        ? undefined
        : {},
    }),
    tailwindcss(),
  ],
})
