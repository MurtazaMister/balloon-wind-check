import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// Fix for Accept header 404 issue
function fixAcceptHeader404() {
  return {
    name: 'fix-accept-header-404',
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        if (req.headers.accept === 'application/json, text/plain, */*') {
          req.headers.accept = '*/*';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tsconfigPaths(), fixAcceptHeader404()],
  server: {
    proxy: {
      '/api/windborne': {
        target: 'https://a.windbornesystems.com',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api\/windborne/, '/treasure');
          console.log(`Proxying ${path} -> ${newPath}`);
          return newPath;
        },
        secure: true,
        configure: (proxy: any, _options: any) => {
          proxy.on('error', (err: any, _req: any, _res: any) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (_proxyReq: any, req: any, _res: any) => {
            console.log('Proxying request:', req.url);
          });
        }
      }
    }
  },
  preview: {
    proxy: {
      '/api/windborne': {
        target: 'https://a.windbornesystems.com',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api\/windborne/, '/treasure');
          console.log(`Preview proxying ${path} -> ${newPath}`);
          return newPath;
        },
        secure: true,
      }
    }
  }
})
