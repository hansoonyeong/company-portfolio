import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function apiMiddlewarePlugin() {
  return {
    name: 'soono-api-middleware',
    apply: 'serve',
    async configureServer(server) {
      const { app } = await import('./server/index.js')
      server.middlewares.use(app)
    },
  }
}

export default defineConfig({
  plugins: [react(), apiMiddlewarePlugin()],
})
