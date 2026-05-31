import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Serve /uploads/* directly from the server's uploads directory on disk.
// This means uploaded images are available immediately without going through
// the backend proxy — so nodemon restarts never cause ECONNREFUSED for images.
function serveUploads() {
  const uploadsRoot = path.resolve(__dirname, '../server/uploads')
  return {
    name: 'serve-uploads',
    configureServer(server) {
      server.middlewares.use('/uploads', (req, res, next) => {
        const filePath = path.join(uploadsRoot, req.url.replace(/\?.*$/, ''))
        try {
          const stat = fs.statSync(filePath)
          if (stat.isFile()) {
            const ext = path.extname(filePath).toLowerCase()
            const mime = {
              '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
              '.png': 'image/png',  '.webp': 'image/webp',
              '.gif': 'image/gif',  '.svg': 'image/svg+xml',
            }[ext] || 'application/octet-stream'
            res.setHeader('Content-Type', mime)
            res.setHeader('Cache-Control', 'no-store')
            fs.createReadStream(filePath).pipe(res)
            return
          }
        } catch {
          // file not found — fall through to next middleware
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveUploads()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // '/uploads' is intentionally NOT proxied — handled by serveUploads() plugin above
    },
  },
})
