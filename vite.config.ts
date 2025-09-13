import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    proxy: {
      '/api/windborne': {
        target: 'https://a.windbornesystems.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/windborne/, '/treasure'),
        secure: true,
      }
    }
  }
})
